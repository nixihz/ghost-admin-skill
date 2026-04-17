import { Command } from 'commander';
import { createClient } from '../lib/api.js';
import { ensureHtml } from '../lib/markdown.js';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const postsCommand = new Command('posts')
  .description('Manage Ghost posts');

postsCommand
  .command('list')
  .description('List all posts')
  .option('-l, --limit <number>', 'Number of posts to fetch', '15')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-i, --include <items>', 'Include related data (tags,authors)', 'tags,authors')
  .option('--format <formats>', 'Content formats (html,lexical)', 'html,lexical')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Fetching posts...').start();

    try {
      const result = await client.getPosts({
        limit: options.limit,
        page: options.page,
        include: options.include,
        formats: options.format
      });

      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

postsCommand
  .command('get')
  .description('Get a single post by ID or slug')
  .argument('<id>', 'Post ID, UUID, or slug')
  .option('-i, --include <items>', 'Include related data', 'tags,authors')
  .action(async (id, options) => {
    const client = getClient();
    const spinner = ora('Fetching post...').start();

    try {
      let result;
      // Ghost ID (24-char hex) or UUID: use getPost directly
      if (looksLikeGhostId(id) || looksLikeUuid(id)) {
        result = await client.getPost(id, { include: options.include });
      } else {
        // Otherwise treat as slug
        result = await client.getPostBySlug(id, { include: options.include });
      }

      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

postsCommand
  .command('create')
  .description('Create a new post')
  .requiredOption('-t, --title <title>', 'Post title')
  .option('-c, --content <html>', 'Post content (HTML)')
  .option('-s, --status <status>', 'Post status (draft, published, scheduled)', 'draft')
  .option('--slug <slug>', 'Post slug')
  .option('--feature-image <url>', 'Featured image URL')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Creating post...').start();

    try {
      const postData = {
        title: options.title,
        status: options.status
      };

      if (options.content) {
        postData.html = ensureHtml(options.content);
      }
      if (options.slug) {
        postData.slug = options.slug;
      }
      if (options.featureImage) {
        postData.feature_image = options.featureImage;
      }

      const result = await client.createPost(postData);
      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

postsCommand
  .command('update')
  .description('Update an existing post')
  .argument('<id>', 'Post ID or slug')
  .option('-t, --title <title>', 'Post title')
  .option('-c, --content <html>', 'Post content (HTML)')
  .option('-s, --status <status>', 'Post status')
  .option('--slug <slug>', 'Post slug')
  .option('-e, --custom-excerpt <excerpt>', 'SEO meta description (maps to custom_excerpt)')
  .option('--tags <tags>', 'Comma-separated tag names (e.g., "AI,Claude,Tech")')
  .action(async (id, options) => {
    const client = getClient();
    const spinner = ora('Updating post...').start();

    try {
      const postData = {};
      if (options.title) postData.title = options.title;
      if (options.content) postData.html = ensureHtml(options.content);
      if (options.status) postData.status = options.status;
      if (options.slug) postData.slug = options.slug;
      if (options.customExcerpt) postData.custom_excerpt = options.customExcerpt;
      if (options.tags) {
        // Convert comma-separated tags to array of {name} objects
        postData.tags = options.tags.split(',').map(name => ({ name: name.trim() }));
      }

      // Resolve ID: if it looks like a slug (contains - but isn't a UUID), resolve to ID first
      const resolvedId = await resolvePostId(id, client);
      const result = await client.updatePost(resolvedId, postData);
      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

postsCommand
  .command('delete')
  .description('Delete a post')
  .argument('<id>', 'Post ID, UUID, or slug')
  .action(async (id) => {
    const client = getClient();
    const spinner = ora('Deleting post...').start();

    try {
      const resolvedId = await resolvePostId(id, client);
      await client.deletePost(resolvedId);
      spinner.succeed('Post deleted successfully');
    } catch (error) {
      spinner.fail(error.message);
    }
  });

// Helper to get client from config
function getClient() {
  const config = loadConfig();
  if (!config.apiKey || !config.domain) {
    throw new Error('Not authenticated. Run: ghost-admin auth --key <api-key> --domain <domain>');
  }
  return createClient(config.domain, config.apiKey);
}

function loadConfig() {
  const homeDir = os.homedir();
  const configPath = path.join(homeDir, '.ghost-admin-config.json');

  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return {};
}

// Ghost internal ID: 24-char hex string (e.g., "69e245a86d5ce1000135f4d3")
// Looks like a partial UUID but has no dashes
const GHOST_ID_REGEX = /^[0-9a-f]{24}$/i;

// Proper UUID regex: 8-4-4-4-12 hex characters with dashes
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function looksLikeUuid(id) {
  return UUID_REGEX.test(id);
}

function looksLikeGhostId(id) {
  return GHOST_ID_REGEX.test(id);
}

async function resolvePostId(id, client) {
  // Ghost internal ID (24-char hex) or proper UUID: use getPost directly
  if (looksLikeGhostId(id) || looksLikeUuid(id)) {
    return id;
  }
  // Numeric ID: use directly
  if (/^\d+$/.test(id)) {
    return id;
  }
  // Otherwise treat as slug and resolve to ID
  const result = await client.getPostBySlug(id);
  if (!result.posts || result.posts.length === 0) {
    throw new Error(`Post not found: ${id}`);
  }
  return result.posts[0].id;
}
