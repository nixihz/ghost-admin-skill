---
name: ghost-admin
description: Interact with Ghost CMS Admin API. Use when user wants to manage Ghost posts, pages, images, members, tiers, newsletters, tags, themes, or webhooks. Also triggers when user mentions Ghost CMS, Ghost admin, Ghost API key, or needs to publish/content manage a Ghost blog. Make sure to use this skill for any Ghost-related content management tasks.
---

# Ghost Admin API Skill

Use this skill when working with Ghost CMS Admin API. This skill covers authentication, posts, pages, images, tags, members, tiers, newsletters, site info, themes, and webhooks.

## Setup

**IMPORTANT: Before using any ghost-admin command, always check if the CLI is installed:**

1. Check if `ghost-admin` is available: `which ghost-admin` or `ghost-admin --version`
2. If not installed, automatically install it: `npm install -g ghost-admin-cli`
3. If not authenticated, prompt user to run: `ghost-admin auth --key <api-key> --domain <domain>`

## Authentication

Ghost Admin API uses **API Key authentication via JWT tokens**:

1. Split your admin API key by `:` into `id` and `secret`
2. Generate a JWT with:
   - Algorithm: HS256
   - Header: `kid` (key ID) = the `id` part from step 1
   - Claims: `iat` (issued at), `exp` (max 5 minutes), `aud: "/admin/"`, `kid` = the `id` part
3. The `secret` must be decoded from hex to binary before signing
4. Include in header: `Authorization: Ghost $token`

**Base URL:** `https://{admin_domain}/ghost/api/admin/`
**Required Headers:**
- `Authorization: Ghost $token`
- `Accept-Version: v{major}.{minor}` (e.g., `v5.0`)
- `Content-Type: application/json` (for POST/PUT)

## Core Resources

### Posts (`/posts/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/posts/` | Browse all posts |
| GET | `/admin/posts/{id}/` | Read single post |
| GET | `/admin/posts/slug/{slug}/` | Read by slug |
| POST | `/admin/posts/` | Create post |
| PUT | `/admin/posts/{id}/` | Update post |
| DELETE | `/admin/posts/{id}/` | Delete post |

**Query Parameters:** `include`, `formats` (html,lexical), `filter`, `limit`, `page`, `order`

**Post Response Fields:** `id`, `uuid`, `slug`, `title`, `lexical`, `html`, `status`, `visibility`, `featured`, `feature_image`, `created_at`, `updated_at`, `published_at`, `url`, `excerpt`, `tags`, `authors`, `primary_author`, `primary_tag`, `newsletter`, `email`

### Pages (`/pages/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/pages/` | Browse all pages |
| GET | `/admin/pages/{id}/` | Read single page |
| GET | `/admin/pages/slug/{slug}/` | Read by slug |
| POST | `/admin/pages/` | Create page |
| POST | `/admin/pages/{id}/copy` | Duplicate page |
| PUT | `/admin/pages/{id}/` | Update page |
| DELETE | `/admin/pages/{id}/` | Delete page |

### Images (`/images/upload/`)

**Endpoint:** `POST /ghost/api/admin/images/upload/`

**Request Body:**
```json
{
  "images": [
    {
      "url": "https://example.com/image.png",
      "ref": "my-image.png"
    }
  ]
}
```

**Response:**
```json
{
  "images": [{ "url": "...", "ref": "my-image.png" }]
}
```

### Tags (`/tags/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/tags/` | Browse all tags |
| GET | `/admin/tags/{id}/` | Read single tag |
| POST | `/admin/tags/` | Create tag |
| PUT | `/admin/tags/{id}/` | Update tag |
| DELETE | `/admin/tags/{id}/` | Delete tag |

### Members (`/members/`)

**Endpoint:** `GET /admin/members/`

**Parameters:** `include` (newsletters,labels), `filter`, `limit`, `page`, `order`

**Response Fields:** `id`, `uuid`, `email`, `name`, `note`, `geolocation`, `created_at`, `email_count`, `email_opened_count`, `email_open_rate`, `status`, `labels`, `subscriptions`, `avatar_image`

### Tiers (`/tiers/`)

**Endpoint:** `GET /admin/tiers/`

**Parameters:**
- `include`: `monthly_price`, `yearly_price`, `benefits`
- `filter`: `type:free|paid`, `visibility:public|none`, `active:true|false`
- Pagination: `limit`, `page`, `order`

### Newsletters (`/newsletters/`)

**Endpoint:** `GET /admin/newsletters/`

**Response Fields:** `id`, `name`, `description`, `slug`, `status`, `sender_name`, `sender_email`, `sender_reply_to`, `subscribe_on_signup`, `header_image`, `show_header_icon`, `show_header_title`, `show_header_name`, `title_font_category`, `title_alignment`, `show_feature_image`, `body_font_category`, `footer_content`, `show_badge`, `uuid`

### Site (`/site/`)

**Endpoint:** `GET /admin/site/`

**Unauthenticated** read-only endpoint.

**Response Fields:** `title`, `description`, `logo`, `url`, `version`

### Themes (`/themes/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/themes/upload/` | Upload theme |
| POST | `/admin/themes/{id}/activate` | Activate theme |

### Webhooks (`/webhooks/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/webhooks/` | Browse webhooks |
| POST | `/admin/webhooks/` | Create webhook |
| PUT | `/admin/webhooks/{id}/` | Update webhook |
| DELETE | `/admin/webhooks/{id}/` | Delete webhook |

## Request/Response Format

All requests use JSON:
```json
{
  "resource_type": [...],
  "meta": {}
}
```

**Pagination:** Default 15 per page. Response includes `meta.pagination` with `page`, `limit`, `pages`, `total`, `next`, `prev`.

## CLI Usage

The CLI tool `ghost-admin` provides these commands:

```bash
# Authentication
ghost-admin auth --key <api-key> --domain <ghost-admin-domain>

# Posts
ghost-admin posts list [--limit 15] [--page 1] [--include tags,authors]
ghost-admin posts get <id>
ghost-admin posts create --title "Title" --content "<html>" [--status draft]
ghost-admin posts update <id> --title "New Title"
ghost-admin posts delete <id>

# Pages
ghost-admin pages list [--limit 15]
ghost-admin pages get <id>
ghost-admin pages create --title "Title" --content "<html>"
ghost-admin pages delete <id>

# Images
ghost-admin images upload --file <path> [--ref <name>]

# Tags
ghost-admin tags list
ghost-admin tags create --name "Tag Name" --slug "tag-slug"
ghost-admin tags delete <id>

# Members
ghost-admin members list [--limit 15]
ghost-admin members get <id>

# Site
ghost-admin site info

# Interactive mode
ghost-admin shell
```

## Implementation Notes

1. **JWT Generation**: The CLI handles JWT generation automatically using the API key
   - Split API key by `:` to get `id` and `secret`
   - Decode `secret` from hex to binary
   - Include `kid` in both JWT header (via `keyid`) and payload
   - Sign with HS256 using decoded secret
2. **Token Expiry**: Tokens expire after 5 minutes; CLI refreshes as needed
3. **Response Wrapping**: Resources are returned in `{resource: [...]}` format
4. **Default Formats**: Posts return Lexical format by default; use `?formats=html,lexical` for HTML

## Creating and Publishing Posts

### URL/Slug Format

**IMPORTANT**: When creating or updating posts, always use a clean, descriptive slug format:

```
YYYY-MM-DD-descriptive-english-title
```

**Examples:**
- `2026-04-17-ghost-admin-skills`
- `2026-04-17-build-cli-tool`
- `2026-04-18-my-project-intro`

**Bad examples** (avoid these):
- `wenzhang-fabiao-gongju` (not English)
- `post-123` (meaningless)
- `My Post Title` (no date, spaces instead of dashes)

### Content Creation Workflow

1. Write content in Markdown
2. Use Ghost's markdown card format (NOT HTML card):
```javascript
const mobiledoc = JSON.stringify({
  version: "0.3.1",
  atoms: [],
  cards: [["markdown", { markdown: markdownContent }]],
  markups: [],
  sections: [[10, 0]]
});
```
3. Create post with custom slug:
```javascript
await client.createPost({
  title: "Your Title",
  slug: "2026-04-17-your-english-title",
  mobiledoc: mobiledoc,
  status: "published"
});
```

### Updating Posts

When updating posts, always include `updated_at` from the current post:
```javascript
const current = await client.getPost(postId);
const updated = await client.request('PUT', `posts/${postId}/`, {
  posts: [{
    updated_at: current.posts[0].updated_at,
    slug: "2026-04-17-new-slug",
    mobiledoc: newMobiledoc
  }]
});
```
