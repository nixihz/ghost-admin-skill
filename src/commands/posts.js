import { Command } from 'commander';
import { createClient } from '../lib/api.js';
import { markdownToMobiledoc, createSlug, isLocalPath, uploadLocalImage } from '../lib/mobiledoc.js';
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
  .option('--table', 'Output as formatted table')
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
      if (options.table) {
        console.table(result.posts.map(p => ({
          title: p.title,
          slug: p.slug,
          status: p.status,
          published_at: p.published_at,
          url: p.url
        })));
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
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
  .option('-c, --content <html>', 'Post content (HTML or Markdown, or path to file)')
  .option('-s, --status <status>', 'Post status (draft, published, scheduled)', 'draft')
  .option('--slug <slug>', 'Post slug')
  .option('--feature-image <url>', 'Featured image URL')
  .option('--meta-title <text>', 'Meta title for SEO')
  .option('--meta-description <text>', 'Meta description for SEO')
  .option('--og-title <text>', 'Open Graph title')
  .option('--og-description <text>', 'Open Graph description')
  .option('--twitter-title <text>', 'Twitter card title')
  .option('--twitter-description <text>', 'Twitter card description')
  .option('--og-image <url>', 'Open Graph image URL')
  .option('--canonical-url <url>', 'Canonical URL')
  .option('--custom-excerpt <text>', 'Custom excerpt')
  .option('--feature-image-alt <text>', 'Featured image alt text')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Creating post...').start();

    try {
      const postData = {
        title: options.title,
        status: options.status
      };

      if (options.content) {
        const content = resolveContent(options.content);
        // Create upload callback for local images in content
        const uploadImage = async (imagePath) => {
          spinner.text = `Uploading local image: ${imagePath}...`;
          return await uploadLocalImage(client, imagePath);
        };
        postData.mobiledoc = await markdownToMobiledoc(content, { uploadImage, title: options.title });
      }
      if (options.slug) {
        postData.slug = options.slug;
      } else {
        // Auto-generate clean slug from title
        postData.slug = createSlug(options.title);
      }
      if (options.featureImage) {
        // If feature image is a local file, upload it first
        if (isLocalPath(options.featureImage)) {
          spinner.text = `Uploading feature image: ${options.featureImage}...`;
          postData.feature_image = await uploadLocalImage(client, options.featureImage);
        } else {
          postData.feature_image = options.featureImage;
        }
      }
      if (options.metaTitle) {
        postData.meta_title = options.metaTitle;
      }
      if (options.metaDescription) {
        postData.meta_description = options.metaDescription;
      }
      if (options.ogTitle) {
        postData.og_title = options.ogTitle;
      }
      if (options.ogDescription) {
        postData.og_description = options.ogDescription;
      }
      if (options.twitterTitle) {
        postData.twitter_title = options.twitterTitle;
      }
      if (options.twitterDescription) {
        postData.twitter_description = options.twitterDescription;
      }
      if (options.ogImage) {
        postData.og_image = options.ogImage;
      }
      if (options.canonicalUrl) {
        postData.canonical_url = options.canonicalUrl;
      }
      if (options.customExcerpt) {
        postData.custom_excerpt = options.customExcerpt;
      }
      if (options.featureImageAlt) {
        postData.feature_image_alt = options.featureImageAlt;
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
  .argument('<id>', 'Post ID, UUID, or slug')
  .option('-t, --title <title>', 'Post title')
  .option('-c, --content <html>', 'Post content (HTML or Markdown, or path to file)')
  .option('-s, --status <status>', 'Post status')
  .option('--slug <slug>', 'Post slug')
  .option('--feature-image <url>', 'Featured image URL')
  .option('--meta-title <text>', 'Meta title for SEO')
  .option('--meta-description <text>', 'Meta description for SEO')
  .option('--og-title <text>', 'Open Graph title')
  .option('--og-description <text>', 'Open Graph description')
  .option('--twitter-title <text>', 'Twitter card title')
  .option('--twitter-description <text>', 'Twitter card description')
  .option('--og-image <url>', 'Open Graph image URL')
  .option('--canonical-url <url>', 'Canonical URL')
  .option('-e, --custom-excerpt <excerpt>', 'SEO meta description (maps to custom_excerpt)')
  .option('--feature-image-alt <text>', 'Featured image alt text')
  .option('--tags <tags>', 'Comma-separated tag names (e.g., "AI,Claude,Tech")')
  .action(async (id, options) => {
    const client = getClient();
    const spinner = ora('Updating post...').start();

    try {
      const postData = {};
      if (options.title) postData.title = options.title;
      if (options.content) {
        const content = resolveContent(options.content);
        const uploadImage = async (imagePath) => {
          spinner.text = `Uploading local image: ${imagePath}...`;
          return await uploadLocalImage(client, imagePath);
        };
        // Use new title if provided, otherwise keep existing post title
        const titleForSkip = options.title || (await resolvePostOrThrow(client, id)).title;
        postData.mobiledoc = await markdownToMobiledoc(content, { uploadImage, title: titleForSkip });
      }
      if (options.status) postData.status = options.status;
      if (options.slug) postData.slug = options.slug;
      if (options.featureImage) {
        if (isLocalPath(options.featureImage)) {
          spinner.text = `Uploading feature image: ${options.featureImage}...`;
          postData.feature_image = await uploadLocalImage(client, options.featureImage);
        } else {
          postData.feature_image = options.featureImage;
        }
      }
      if (options.metaTitle) postData.meta_title = options.metaTitle;
      if (options.metaDescription) postData.meta_description = options.metaDescription;
      if (options.ogTitle) postData.og_title = options.ogTitle;
      if (options.ogDescription) postData.og_description = options.ogDescription;
      if (options.twitterTitle) postData.twitter_title = options.twitterTitle;
      if (options.twitterDescription) postData.twitter_description = options.twitterDescription;
      if (options.ogImage) postData.og_image = options.ogImage;
      if (options.canonicalUrl) postData.canonical_url = options.canonicalUrl;
      if (options.customExcerpt) postData.custom_excerpt = options.customExcerpt;
      if (options.featureImageAlt) postData.feature_image_alt = options.featureImageAlt;
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

postsCommand
  .command('duplicate')
  .description('Duplicate an existing post')
  .argument('<id>', 'Post ID or slug')
  .action(async (id) => {
    const client = getClient();
    const spinner = ora('Duplicating post...').start();

    try {
      const resolvedId = await resolvePostId(id, client);
      const result = await client.copyPost(resolvedId);
      spinner.succeed('Post duplicated successfully');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

postsCommand
  .command('publish')
  .description('Publish a draft post')
  .argument('<id>', 'Post ID or slug')
  .action(async (id) => {
    const client = getClient();
    const spinner = ora('Publishing post...').start();

    try {
      const post = await resolvePostOrThrow(client, id);
      const result = await client.updatePost(post.id, { status: 'published' }, { updatedAt: post.updated_at });
      spinner.succeed('Post published successfully');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

postsCommand
  .command('search')
  .description('Search posts by title or slug')
  .argument('<keyword>', 'Search keyword')
  .option('-l, --limit <number>', 'Number of posts to fetch', '15')
  .option('--table', 'Output as formatted table')
  .action(async (keyword, options) => {
    const client = getClient();
    const spinner = ora('Searching posts...').start();

    try {
      const result = await client.getPosts({
        limit: options.limit,
        filter: `title:~'${escapeNqlString(keyword)}',slug:~'${escapeNqlString(keyword)}'`,
        include: 'tags,authors'
      });

      spinner.succeed(`Found ${result.posts.length} post(s)`);
      if (options.table) {
        console.table(result.posts.map(p => ({
          title: p.title,
          slug: p.slug,
          status: p.status,
          published_at: p.published_at,
          url: p.url
        })));
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
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

async function resolvePostOrThrow(client, id, params = {}) {
  // Ghost ID or UUID: use getPost directly
  if (looksLikeGhostId(id) || looksLikeUuid(id)) {
    const result = await client.getPost(id, params);
    if (!result.posts || result.posts.length === 0) {
      throw new Error(`Post not found: ${id}`);
    }
    return result.posts[0];
  }
  // Otherwise treat as slug
  const result = await client.getPostBySlug(id, params);
  if (!result.posts || result.posts.length === 0) {
    throw new Error(`Post not found: ${id}`);
  }
  return result.posts[0];
}

function escapeNqlString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function resolveContent(content) {
  if (fs.existsSync(content)) {
    return fs.readFileSync(content, 'utf-8');
  }
  return content;
}
