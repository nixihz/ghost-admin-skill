# Ghost Admin CLI & Skill

A CLI tool and Claude Code AI Agent Skill for managing [Ghost](https://ghost.org) — the open source platform for bloggers, newsletter creators, and independent publishers.

**Package name:** `ghost-admin-cli`

## Quick Start

1. Install the skill: `npx skills add nixihz/ghost-admin-skill`
2. The skill will auto-install the CLI when needed
3. When asked for API key, get it from Ghost Admin > Settings > Integrations > Admin API

## Example Prompts

Here are example prompts you can use with this skill:

### Create a Post

```
Write a blog post about Claude Code skill development with:
- Title: "Getting Started with Claude Code Skills"
- English slug in YYYY-MM-DD format
- Content covering: what is a skill, why build one, quick start guide
- Set status to draft
```

### Publish a Draft

```
Publish the latest draft post
```

### Write & Publish with AI

```
Write and publish a blog post about the latest AI coding tools:
- Clean English title
- Slug in YYYY-MM-DD-title format
- Content in markdown with code examples
- Publish immediately
```

## Usage

### Posts

```bash
ghost-admin posts list --limit 10 --include tags,authors
ghost-admin posts get <id-or-slug>
ghost-admin posts create --title "My Post" --content "**Hello World** in Markdown" --status published
ghost-admin posts update <id> --title "Updated Title" --slug 2024-01-15-new-slug
ghost-admin posts delete <id>
```

### Pages

```bash
ghost-admin pages list
ghost-admin pages get <id-or-slug>
ghost-admin pages create --title "My Page" --content "Page **content** in Markdown"
ghost-admin pages update <id> --title "Updated Title"
ghost-admin pages delete <id>
```

### Images

```bash
ghost-admin images upload --file ./image.png --ref "my-image"
```

### Tags

```bash
ghost-admin tags list
ghost-admin tags create --name "Technology" --slug "tech"
ghost-admin tags update <id> --name "Tech" --slug "tech-updated"
ghost-admin tags delete <id>
```

### Members

```bash
ghost-admin members list --limit 20 --include labels
ghost-admin members get <id>
```

### Site

```bash
ghost-admin site info
```

### Tiers

```bash
ghost-admin tiers list --include monthly_price,benefits
```

### Newsletters

```bash
ghost-admin newsletters list
```

### Other Commands

```bash
ghost-admin status     # Check auth status
ghost-admin logout     # Logout
```

## When to Use

This skill activates when you:
- Mention Ghost CMS, Ghost admin, or Ghost API key
- Need to manage posts, pages, images, members, or tiers
- Want to publish or manage blog content on Ghost

## API Coverage

**Available:**
- Posts (CRUD), Pages (CRUD + Copy), Images (Upload), Tags (CRUD)
- Members (Browse, Read), Site (Read), Tiers (Browse), Newsletters (Browse)

**Coming soon:**
- Themes (Upload, Activate), Webhooks (CRUD), Users (Browse, Read)

## Development

```bash
npm install
npm run test
```

## License

MIT
