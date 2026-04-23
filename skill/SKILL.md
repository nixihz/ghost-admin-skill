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
| POST | `/admin/posts/{id}/copy` | Duplicate post (via CLI `duplicate`) |

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

Uploads images with automatic MIME type detection based on file extension (jpg, jpeg, png, gif, webp, svg).

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
ghost-admin posts list [--limit 15] [--page 1] [--include tags,authors] [--table]
ghost-admin posts get <id-or-slug>
ghost-admin posts create --title "Title" --content "**Markdown** content here" [--status draft]
ghost-admin posts create --title "Title" --content ./article.md
ghost-admin posts update <id> --title "New Title" [--custom-excerpt "SEO description"] [--tags "AI,Tech,News"]
ghost-admin posts delete <id>
ghost-admin posts duplicate <id-or-slug>
ghost-admin posts publish <id-or-slug>
ghost-admin posts search <keyword> [--table]

# Pages
ghost-admin pages list [--limit 15]
ghost-admin pages get <id-or-slug>
ghost-admin pages create --title "Title" --content "Page **content** in Markdown"
ghost-admin pages delete <id>

# Images
ghost-admin images upload --file <path> [--ref <name>]

# Tags
ghost-admin tags list
ghost-admin tags create --name "Tag Name" --slug "tag-slug"
ghost-admin tags update <id> --name "New Name"
ghost-admin tags delete <id>

# Members
ghost-admin members list [--limit 15]
ghost-admin members get <id>

# Site
ghost-admin site info

# Interactive mode
ghost-admin shell
```

## Content Format

### How the CLI Handles Content

**Ghost 5 uses Mobiledoc format** (legacy format with markdown cards). The CLI converts Markdown to Mobiledoc automatically:

1. User provides content in **Markdown** via `--content` option
2. CLI uses `marked` to parse Markdown
3. CLI wraps each block as a `markdown` card in Mobiledoc format
4. Mobiledoc is sent to Ghost API and stored correctly

**Auto-Generated Slugs:** If no `--slug` is provided, the CLI automatically generates a clean slug:
- Format: `YYYY-MM-DD-extracted-keywords`
- Example: `Kimi Code Plan 默认就在用最新模型` → `2026-04-23-kimi-code-plan`

**File Input:** `--content` accepts a file path. If the path exists as a file, its contents are read and used:

```bash
ghost-admin posts create --title "My Article" --content ./article.md
```

### Duplicate Title Handling

When your Markdown content starts with a heading that matches the `--title` value, the CLI automatically skips that heading to avoid duplication:

```bash
# Title and first heading are the same - first heading is skipped
ghost-admin posts create --title "My Article Title" --content "./article.md"
# article.md content: # My Article Title\n\n正文... → 正文 only
```

This works by comparing cleaned text (removing punctuation, spaces, case differences).

### Feature Image

The `--feature-image` option sets the post's cover/featured image:

```bash
ghost-admin posts create --title "Title" --feature-image "https://example.com/cover.jpg"
```

**Supported formats:**
- Online URLs (http://, https://) — used directly
- Local file paths — automatically uploaded to Ghost and URL is replaced

**Examples:**
```bash
# Online URL
ghost-admin posts create --title "My Post" --feature-image "https://xiezhixin.com/content/images/2026/04/cover.jpg"

# Local file (auto-uploaded)
ghost-admin posts create --title "My Post" --feature-image "./local-cover.png"
```

### Content Images

When content contains local image references (not URLs), the CLI automatically:
1. Detects local image paths in Markdown
2. Uploads each image to Ghost
3. Replaces the local path with the Ghost URL in the content

```bash
# Content with local images - images are auto-uploaded
ghost-admin posts create --title "My Post" --content "./article.md"
```

### SEO Fields

Both `posts create` and `posts update` support these SEO options:

```bash
ghost-admin posts create --title "Title" \
  --meta-title "SEO Title" \
  --meta-description "SEO Description" \
  --og-title "Social Title" \
  --og-description "Social Description" \
  --og-image "https://example.com/image.png" \
  --canonical-url "https://example.com/post" \
  --custom-excerpt "Brief summary" \
  --feature-image-alt "Alt text"
```

## Implementation Notes

1. **JWT Generation**: The CLI handles JWT generation automatically using the API key
   - Split API key by `:` to get `id` and `secret`
   - Decode `secret` from hex to binary
   - Include `kid` in both JWT header (via `keyid`) and payload
   - Sign with HS256 using decoded secret
2. **Token Expiry**: Tokens expire after 5 minutes; CLI refreshes as needed
3. **Response Wrapping**: Resources are returned in `{resource: [...]}` format
4. **Content Format**: Ghost 5 uses Mobiledoc format with markdown cards; the CLI converts Markdown to Mobiledoc automatically

## Creating and Publishing Posts

### URL/Slug Format

The CLI auto-generates clean slugs if not provided:
- Format: `YYYY-MM-DD-extracted-keywords`
- Keywords are extracted from the title, keeping English words and significant Chinese characters

**Manual slug override:** Use `--slug` to specify a custom slug:

```bash
ghost-admin posts create --title "My Article" --slug "2026-04-23-my-custom-slug"
```

**Good examples:**
- `2026-04-17-ghost-admin-skills`
- `2026-04-17-build-cli-tool`
- `2026-04-18-my-project-intro`

**Bad examples** (avoid these):
- `wenzhang-fabiao-gongju` (pure Chinese without keywords)
- `post-123` (meaningless)
- `My Post Title` (no date, spaces instead of dashes)

### Updating Posts

When updating posts via the CLI, the `updated_at` field is automatically handled:

```bash
ghost-admin posts update my-post-slug --title "New Title" --content ./updated.md
```

The CLI fetches the current post to get `updated_at` before sending the PUT request.

## SEO Optimization

Ghost 自动生成 `<title>`、Open Graph 和 Twitter Card 标签，但可以通过以下方式优化：

### 1. 自定义摘要（meta description）

```bash
ghost-admin posts update <id> --custom-excerpt "你的SEO描述内容"
```

`custom_excerpt` 会映射到：
- `<meta name="description">`
- `og:description`（如果未单独设置）
- 文章列表中的摘要显示

### 2. 文章标签（article:tag）

```bash
# 添加标签（逗号分隔）
ghost-admin posts update <id> --tags "AI,Claude,大语言模型"
```

Ghost 会自动为每个标签创建对应的 `article:tag` Open Graph 标签。

### 3. 精选图片 alt 文字

```bash
ghost-admin posts update <id> --feature-image-alt "Alt text for feature image"
```

### 4. JSON-LD 结构化数据

Ghost 主题的 `post.hbs` 模板负责输出 JSON-LD。如需修改 `author.sameAs` 社交链接，在 Ghost Admin > Settings > Staff > Author Profile 中填写。

**Note on Ghost 5:**
- Ghost 5 uses Mobiledoc format for content storage (not Lexical)
- Each Markdown block becomes a `markdown` card in Mobiledoc
- This CLI uses Mobiledoc format, so content updates work correctly
