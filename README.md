# Ghost Admin CLI & Skill

A CLI tool and Claude Code Skill for managing [Ghost](https://ghost.org) — the best open source blog & newsletter platform.

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
ghost-admin posts create --title "My Post" --content "<p>Hello World</p>" --status published
ghost-admin posts update <id> --title "Updated Title" --slug 2024-01-15-new-slug
ghost-admin posts delete <id>
```

### Pages

```bash
ghost-admin pages list
ghost-admin pages get <id-or-slug>
ghost-admin pages create --title "My Page" --content "<p>Content</p>"
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

## Skill Triggers

- User mentions Ghost CMS, Ghost admin, or Ghost API key
- User needs to manage Ghost posts, pages, images, members, or tiers
- User needs to publish or manage Ghost blog content

## API Coverage

- [x] Posts (CRUD)
- [x] Pages (CRUD + Copy)
- [x] Images (Upload)
- [x] Tags (CRUD)
- [x] Members (Browse, Read)
- [x] Site (Read)
- [x] Tiers (Browse)
- [x] Newsletters (Browse)
- [ ] Themes (Upload, Activate)
- [ ] Webhooks (CRUD)
- [ ] Users (Browse, Read)

## Development

```bash
npm run test
```

## License

MIT
