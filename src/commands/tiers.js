import { Command } from 'commander';
import { createClient } from '../lib/api.js';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const tiersCommand = new Command('tiers')
  .description('Manage Ghost tiers');

tiersCommand
  .command('list')
  .description('List all tiers')
  .option('-l, --limit <number>', 'Number of tiers to fetch', '15')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-i, --include <items>', 'Include data (monthly_price,yearly_price,benefits)', '')
  .option('-f, --filter <filter>', 'Filter tiers (type:free|paid, visibility:public|none, active:true|false)', '')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Fetching tiers...').start();

    try {
      const params = {
        limit: options.limit,
        page: options.page
      };

      if (options.include) {
        params.include = options.include;
      }
      if (options.filter) {
        params.filter = options.filter;
      }

      const result = await client.getTiers(params);
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
