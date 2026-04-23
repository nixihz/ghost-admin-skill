import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '../lib/api.js';
import ora from 'ora';

export const authCommand = new Command('auth')
  .description('Authenticate with Ghost Admin API');

authCommand
  .requiredOption('-k, --key <api-key>', 'Ghost Admin API key (format: id:secret)')
  .requiredOption('-d, --domain <domain>', 'Ghost admin domain (e.g., https://your-ghost-site.com)')
  .action(async (options) => {
    const spinner = ora('Authenticating...').start();

    try {
      // Validate API key format
      const parts = options.key.split(':');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error('Invalid API key format. Expected: id:secret');
      }

      // Test connection
      const client = createClient(options.domain, options.key);
      await client.getSite();

      // Save config
      const homeDir = os.homedir();
      const configPath = path.join(homeDir, '.ghost-admin-config.json');
      const config = {
        apiKey: options.key,
        domain: options.domain.replace(/\/$/, ''),
        authenticated: true,
        authenticatedAt: new Date().toISOString()
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });

      spinner.succeed('Authenticated successfully!');
      console.log(`Config saved to: ${configPath}`);
    } catch (error) {
      spinner.fail(`Authentication failed: ${error.message}`);
    }
  });

// Logout command
export const logoutCommand = new Command('logout')
  .description('Logout and clear saved credentials')
  .action(() => {
    const homeDir = os.homedir();
    const configPath = path.join(homeDir, '.ghost-admin-config.json');

    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log('Logged out successfully');
    } else {
      console.log('Not logged in');
    }
  });

// Status command
export const statusCommand = new Command('status')
  .description('Check authentication status')
  .action(() => {
    const homeDir = os.homedir();
    const configPath = path.join(homeDir, '.ghost-admin-config.json');

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log('Authenticated:', isAuthenticatedConfig(config) ? 'Yes' : 'No');
      console.log('Domain:', config.domain);
      console.log('Authenticated at:', config.authenticatedAt);
    } else {
      console.log('Not authenticated');
    }
  });

function isAuthenticatedConfig(config = {}) {
  return Boolean(config.authenticated || config.authenticatedAt);
}
