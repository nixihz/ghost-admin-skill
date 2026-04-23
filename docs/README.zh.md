# Ghost Admin CLI & Skill

一个用于管理 [Ghost](https://ghost.org) 的 CLI 工具和 AI Agent Skill —— Ghost 是面向博客作者、 Newsletter 创作者和独立出版者的开源平台。

**包名：** `ghost-admin-cli`

**English Documentation:** [README.md](../README.md)

---

## 快速开始

1. 安装 Skill：`npx skills add nixihz/ghost-admin-skill`
2. Skill 会在需要时自动安装 CLI
3. 当要求提供 API Key 时，从 Ghost Admin > Settings > Integrations > Admin API 获取

## 示例提示词

以下是你可以配合此 Skill 使用的示例提示词：

### 创建文章

```
Write a blog post about Claude Code skill development with:
- Title: "Getting Started with Claude Code Skills"
- English slug in YYYY-MM-DD format
- Content covering: what is a skill, why build one, quick start guide
- Set status to draft
```

### 发布草稿

```
Publish the latest draft post
```

### 使用 AI 撰写并发布

```
Write and publish a blog post about the latest AI coding tools:
- Clean English title
- Slug in YYYY-MM-DD-title format
- Content in markdown with code examples
- Publish immediately
```

## 使用方式

### 文章 (Posts)

```bash
ghost-admin posts list --limit 10 --include tags,authors [--table]
ghost-admin posts get <id-or-slug>
ghost-admin posts create --title "My Post" --content "**Hello World** in Markdown" --status published
ghost-admin posts create --title "My Post" --content ./article.md
ghost-admin posts update <id> --title "Updated Title" --slug 2024-01-15-new-slug
ghost-admin posts delete <id>
ghost-admin posts duplicate <id-or-slug>
ghost-admin posts publish <id-or-slug>
ghost-admin posts search <keyword> [--table]
```

### 页面 (Pages)

```bash
ghost-admin pages list
ghost-admin pages get <id-or-slug>
ghost-admin pages create --title "My Page" --content "Page **content** in Markdown"
ghost-admin pages update <id> --title "Updated Title"
ghost-admin pages delete <id>
```

### 图片 (Images)

```bash
ghost-admin images upload --file ./image.png --ref "my-image"
```

### 标签 (Tags)

```bash
ghost-admin tags list
ghost-admin tags create --name "Technology" --slug "tech"
ghost-admin tags update <id> --name "Tech" --slug "tech-updated"
ghost-admin tags delete <id>
```

### 会员 (Members)

```bash
ghost-admin members list --limit 20 --include labels
ghost-admin members get <id>
```

### 站点 (Site)

```bash
ghost-admin site info
```

### 订阅等级 (Tiers)

```bash
ghost-admin tiers list --include monthly_price,benefits
```

### 邮件订阅 (Newsletters)

```bash
ghost-admin newsletters list
```

### 其他命令

```bash
ghost-admin status     # 检查认证状态
ghost-admin logout     # 退出登录
```

## 触发条件

此 Skill 在以下场景激活：
- 提到 Ghost CMS、Ghost admin 或 Ghost API key
- 需要管理文章、页面、图片、会员或订阅等级
- 想要在 Ghost 上发布或管理博客内容

## API 覆盖范围

**已支持：**
- Posts (CRUD + Duplicate + Publish + Search)、Pages (CRUD + Copy)、Images (Upload)、Tags (CRUD)
- Members (Browse, Read)、Site (Read)、Tiers (Browse)、Newsletters (Browse)

**即将支持：**
- Themes (Upload, Activate)、Webhooks (CRUD)、Users (Browse, Read)

## 开发

```bash
npm install
npm run test
```

## 许可证

MIT
