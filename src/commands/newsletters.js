import { Command } from 'commander';
import { createClient } from '../lib/api.js';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const newslettersCommand = new Command('newsletters')
  .description('Manage Ghost newsletters');

newslettersCommand
  .command('list')
  .description('List all newsletters')
  .option('-l, --limit <number>', 'Number of newsletters to fetch', '50')
  .action(async (options) => {
    const client = getClient();
    const spinner = ora('Fetching newsletters...').start();

    try {
      const result = await client.getNewsletters({
        limit: options.limit
      });

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
