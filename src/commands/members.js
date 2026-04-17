import { Command } from 'commander';
import { createClient } from '../lib/api.js';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const membersCommand = new Command('members')
  .description('Manage Ghost members');

membersCommand
  .command('list')
  .description('List all members')
  .option('-l, --limit <number>', 'Number of members to fetch', '15')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-i, --include <items>', 'Include related data (newsletters,labels)', '')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Fetching members...').start();

    try {
      const params = {
        limit: options.limit,
        page: options.page
      };

      if (options.include) {
        params.include = options.include;
      }

      const result = await client.getMembers(params);
      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      spinner.fail(error.message);
    }
  });

membersCommand
  .command('get')
  .description('Get a single member by ID')
  .argument('<id>', 'Member ID')
  .action(async (id) => {
    const client = getClient();
    const spinner = ora('Fetching member...').start();

    try {
      const result = await client.getMember(id);
      spinner.succeed();
      console.log(JSON.stringify(result, null, 2));
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
