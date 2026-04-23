#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'node:module';
import { authCommand, logoutCommand, statusCommand } from './commands/auth.js';
import { postsCommand } from './commands/posts.js';
import { pagesCommand } from './commands/pages.js';
import { imagesCommand } from './commands/images.js';
import { tagsCommand } from './commands/tags.js';
import { membersCommand } from './commands/members.js';
import { siteCommand } from './commands/site.js';
import { tiersCommand } from './commands/tiers.js';
import { newslettersCommand } from './commands/newsletters.js';

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

program
  .name('ghost-admin')
  .description('Ghost Admin API CLI tool')
  .version(version);

// Add commands
program.addCommand(authCommand);
program.addCommand(logoutCommand);
program.addCommand(statusCommand);
program.addCommand(postsCommand);
program.addCommand(pagesCommand);
program.addCommand(imagesCommand);
program.addCommand(tagsCommand);
program.addCommand(membersCommand);
program.addCommand(siteCommand);
program.addCommand(tiersCommand);
program.addCommand(newslettersCommand);

program.parse();
