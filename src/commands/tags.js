import { Command } from 'commander';
import { createClient } from '../lib/api.js';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const tagsCommand = new Command('tags')
  .description('Manage Ghost tags');

tagsCommand
  .command('list')
  .description('List all tags')
  .option('-l, --limit <number>', 'Number of tags to fetch', '15')
  .option('-p, --page <number>', 'Page number', '1')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Fetching tags...').start();

    try {
      const result = await client.getTags({
        limit: options.limit,
        page: options.page
      });

      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

tagsCommand
  .command('create')
  .description('Create a new tag')
  .requiredOption('-n, --name <name>', 'Tag name')
  .option('-s, --slug <slug>', 'Tag slug')
  .option('-d, --description <desc>', 'Tag description')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Creating tag...').start();

    try {
      const tagData = {
        name: options.name
      };

      if (options.slug) tagData.slug = options.slug;
      if (options.description) tagData.description = options.description;

      const result = await client.createTag(tagData);
      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

tagsCommand
  .command('update')
  .description('Update an existing tag')
  .argument('<id>', 'Tag ID')
  .option('-n, --name <name>', 'Tag name')
  .option('-s, --slug <slug>', 'Tag slug')
  .option('-d, --description <desc>', 'Tag description')
  .action(async (id, options) => {
    const client = getClient();
    const spinner = ora('Updating tag...').start();

    try {
      const tagData = {};
      if (options.name) tagData.name = options.name;
      if (options.slug) tagData.slug = options.slug;
      if (options.description) tagData.description = options.description;

      const result = await client.updateTag(id, tagData);
      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

tagsCommand
  .command('delete')
  .description('Delete a tag')
  .argument('<id>', 'Tag ID')
  .action(async (id) => {
    const client = getClient();
    const spinner = ora('Deleting tag...').start();

    try {
      await client.deleteTag(id);
      spinner.succeed('Tag deleted successfully');
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
