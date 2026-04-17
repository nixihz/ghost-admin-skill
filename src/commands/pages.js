import { Command } from 'commander';
import { createClient } from '../lib/api.js';
import { ensureHtml } from '../lib/markdown.js';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const pagesCommand = new Command('pages')
  .description('Manage Ghost pages');

pagesCommand
  .command('list')
  .description('List all pages')
  .option('-l, --limit <number>', 'Number of pages to fetch', '15')
  .option('-p, --page <number>', 'Page number', '1')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Fetching pages...').start();

    try {
      const result = await client.getPages({
        limit: options.limit,
        page: options.page
      });

      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

pagesCommand
  .command('get')
  .description('Get a single page by ID or slug')
  .argument('<id>', 'Page ID or slug')
  .action(async (id) => {
    const client = getClient();
    const spinner = ora('Fetching page...').start();

    try {
      let result;
      if (id.includes('-')) {
        result = await client.getPage(id);
      } else {
        result = await client.getPageBySlug(id);
      }

      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

pagesCommand
  .command('create')
  .description('Create a new page')
  .requiredOption('-t, --title <title>', 'Page title')
  .option('-c, --content <html>', 'Page content (HTML)')
  .option('--slug <slug>', 'Page slug')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Creating page...').start();

    try {
      const pageData = {
        title: options.title
      };

      if (options.content) {
        pageData.html = ensureHtml(options.content);
      }
      if (options.slug) {
        pageData.slug = options.slug;
      }

      const result = await client.createPage(pageData);
      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

pagesCommand
  .command('update')
  .description('Update an existing page')
  .argument('<id>', 'Page ID')
  .option('-t, --title <title>', 'Page title')
  .option('-c, --content <html>', 'Page content (HTML)')
  .option('-s, --slug <slug>', 'Page slug')
  .action(async (id, options) => {
    const client = getClient();
    const spinner = ora('Updating page...').start();

    try {
      const pageData = {};
      if (options.title) pageData.title = options.title;
      if (options.content) pageData.html = ensureHtml(options.content);
      if (options.slug) pageData.slug = options.slug;

      const result = await client.updatePage(id, pageData);
      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

pagesCommand
  .command('delete')
  .description('Delete a page')
  .argument('<id>', 'Page ID')
  .action(async (id) => {
    const client = getClient();
    const spinner = ora('Deleting page...').start();

    try {
      await client.deletePage(id);
      spinner.succeed('Page deleted successfully');
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
