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
  .argument('<id>', 'Post ID or slug')
  .option('-i, --include <items>', 'Include related data', 'tags,authors')
  .action(async (id, options) => {
    const client = getClient();
    const spinner = ora('Fetching post...').start();

    try {
      let result;
      if (id.includes('-')) {
        result = await client.getPost(id, { include: options.include });
      } else {
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
  .action(async (id, options) => {
    const client = getClient();
    const spinner = ora('Updating post...').start();

    try {
      const postData = {};
      if (options.title) postData.title = options.title;
      if (options.content) postData.html = ensureHtml(options.content);
      if (options.status) postData.status = options.status;
      if (options.slug) postData.slug = options.slug;

      let result;
      if (id.includes('-') && !id.match(/^[0-9a-f]+$/)) {
        // Looks like a slug, use getPostBySlug first to get the ID
        const postBySlug = await client.getPostBySlug(id);
        const postId = postBySlug.posts[0].id;
        result = await client.updatePost(postId, postData);
      } else {
        result = await client.updatePost(id, postData);
      }
      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

postsCommand
  .command('delete')
  .description('Delete a post')
  .argument('<id>', 'Post ID')
  .action(async (id) => {
    const client = getClient();
    const spinner = ora('Deleting post...').start();

    try {
      await client.deletePost(id);
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
