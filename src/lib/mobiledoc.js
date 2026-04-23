import { marked } from 'marked';

/**
 * Convert Markdown to Ghost's mobiledoc format
 * Ghost 5 uses mobiledoc for content storage
 * @param {string} markdown - Markdown content
 * @param {Object} options - Options
 * @param {Function} options.uploadImage - Optional async function(imagePath) => imageUrl
 * @param {string} options.title - Post title (to skip duplicate first heading)
 * @returns {string} Mobiledoc JSON string
 */
export async function markdownToMobiledoc(markdown, options = {}) {
  if (!markdown) {
    return createEmptyMobiledoc();
  }

  const tokens = marked.lexer(markdown);
  const atoms = [];
  const cards = [];
  const markups = [];
  const sections = [];

  // Track if we've skipped the first heading (to avoid duplicate title)
  let skippedFirstHeading = false;

  for (const token of tokens) {
    if (token.type === 'space') continue;

    // Skip first heading if it matches the post title
    if (!skippedFirstHeading && token.type === 'heading') {
      const headingText = extractTextFromTokens(token.tokens || [{ type: 'text', text: token.text }]);
      // Check if heading matches title (compare cleaned text)
      if (headingText === options.title || cleanText(headingText) === cleanText(options.title)) {
        skippedFirstHeading = true;
        continue;
      }
    }

    if (token.type === 'heading') {
      const text = extractTextFromTokens(token.tokens || [{ type: 'text', text: token.text }]);
      cards.push(['markdown', { markdown: `${'#'.repeat(token.depth)} ${text}` }]);
      sections.push([10, cards.length - 1, 0]);
    } else if (token.type === 'paragraph') {
      // Process paragraph - could contain text, images, etc.
      const markdownContent = await extractMarkdownFromTokens(token.tokens || [{ type: 'text', text: token.text }], options.uploadImage);
      if (markdownContent.trim()) {
        cards.push(['markdown', { markdown: markdownContent }]);
        sections.push([10, cards.length - 1, 0]);
      }
    } else if (token.type === 'code') {
      cards.push(['markdown', { markdown: `\`\`\`${token.lang || ''}\n${token.text}\n\`\`\`` }]);
      sections.push([10, cards.length - 1, 0]);
    } else if (token.type === 'blockquote') {
      const text = extractTextFromTokens(token.tokens || [{ type: 'text', text: token.text }]);
      cards.push(['markdown', { markdown: `> ${text}` }]);
      sections.push([10, cards.length - 1, 0]);
    } else if (token.type === 'list') {
      const listContent = token.items.map(item => {
        const text = extractTextFromTokens(item.tokens || [{ type: 'text', text: item.text }]);
        return token.ordered ? `1. ${text}` : `- ${text}`;
      }).join('\n');
      cards.push(['markdown', { markdown: listContent }]);
      sections.push([10, cards.length - 1, 0]);
    } else if (token.type === 'hr') {
      cards.push(['markdown', { markdown: '---' }]);
      sections.push([10, cards.length - 1, 0]);
    } else if (token.type === 'table') {
      const tableContent = formatTableAsMarkdown(token);
      cards.push(['markdown', { markdown: tableContent }]);
      sections.push([10, cards.length - 1, 0]);
    } else if (token.type === 'html') {
      cards.push(['markdown', { markdown: token.raw }]);
      sections.push([10, cards.length - 1, 0]);
    }
  }

  return JSON.stringify({
    version: '0.3.1',
    atoms: atoms,
    cards: cards,
    markups: markups,
    sections: sections
  });
}

/**
 * Clean text for comparison (remove punctuation, extra spaces)
 */
function cleanText(text) {
  if (!text) return '';
  return text.replace(/[#*_`~\[\]（）()【】{}|\\<>:;"'，,。.！!？?…—–-\s]/g, '').trim().toLowerCase();
}

/**
 * Extract markdown text from tokens, including converting images to HTML
 * If uploadImage is provided and image is local, upload it first
 */
async function extractMarkdownFromTokens(tokens, uploadImage) {
  if (!tokens) return '';

  let result = '';
  for (const token of tokens) {
    if (token.type === 'text') {
      result += token.text;
    } else if (token.type === 'image') {
      let src = token.href || '';

      // If it's a local image and we have an upload function, upload it
      if (uploadImage && src && !isOnlineUrl(src)) {
        try {
          src = await uploadImage(src);
        } catch (err) {
          console.warn(`Failed to upload image ${token.href}: ${err.message}`);
        }
      }

      const alt = token.title || token.text || '';
      result += `<img src="${src}" alt="${alt}">`;
    } else if (token.type === 'strong') {
      const inner = await extractMarkdownFromTokens(token.tokens || [{ type: 'text', text: token.text }], uploadImage);
      result += `**${inner}**`;
    } else if (token.type === 'em') {
      const inner = await extractMarkdownFromTokens(token.tokens || [{ type: 'text', text: token.text }], uploadImage);
      result += `*${inner}*`;
    } else if (token.type === 'codespan') {
      result += `\`${token.text}\``;
    } else if (token.type === 'link') {
      const inner = await extractMarkdownFromTokens(token.tokens || [{ type: 'text', text: token.text }], uploadImage);
      result += `[${inner}](${token.href})`;
    } else if (token.tokens) {
      result += await extractMarkdownFromTokens(token.tokens, uploadImage);
    }
  }
  return result;
}

/**
 * Check if URL is online (http:// or https://)
 */
function isOnlineUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Extract text from tokens (sync version)
 */
function extractTextFromTokens(tokens) {
  if (!tokens) return '';
  return tokens.map(t => {
    if (t.type === 'text') return t.text;
    if (t.tokens) return extractTextFromTokens(t.tokens);
    return '';
  }).join('');
}

function formatTableAsMarkdown(token) {
  const headerCells = token.header || [];
  const rows = token.rows || [];

  let md = '';

  // Header row
  md += '| ' + headerCells.map(c => c.text || '').join(' | ') + ' |\n';
  md += '| ' + headerCells.map(() => '---').join(' | ') + ' |\n';

  // Data rows
  for (const row of rows) {
    md += '| ' + row.map(c => c.text || '').join(' | ') + ' |\n';
  }

  return md;
}

function createEmptyMobiledoc() {
  return JSON.stringify({
    version: '0.3.1',
    atoms: [],
    cards: [],
    markups: [],
    sections: []
  });
}

/**
 * Create a slug from title
 * @param {string} title - Post title
 * @param {string} date - Date string (YYYY-MM-DD format)
 * @returns {string} Clean slug
 */
export function createSlug(title, date = null) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const keyWords = extractKeyWords(title);
  return `${dateStr}-${keyWords}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function extractKeyWords(title) {
  const cleaned = title
    .replace(/[#*_`~\[\]（）()【】{}|\\<>:;"'，,。.！!？?…—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(w => w.length > 0);
  const keyWords = words.slice(0, 5).map(w => {
    return w.toLowerCase().replace(/[^a-z0-9]/g, '');
  }).filter(w => w.length > 1);

  return keyWords.join('-');
}

/**
 * Check if a path is a local file path (not a URL)
 */
export function isLocalPath(path) {
  if (!path) return false;
  // Not a URL
  if (path.startsWith('http://') || path.startsWith('https://')) return false;
  // Could be a relative or absolute file path
  return true;
}

/**
 * Upload local image to Ghost and return the URL
 */
export async function uploadLocalImage(client, imagePath) {
  const fs = await import('fs');
  const path = await import('path');

  // Check if file exists
  if (!fs.default.existsSync(imagePath)) {
    throw new Error(`File not found: ${imagePath}`);
  }

  // Get file stats
  const stats = fs.default.statSync(imagePath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${imagePath}`);
  }

  // Read file
  const fileBuffer = fs.default.readFileSync(imagePath);
  const fileName = path.default.basename(imagePath);

  // Determine MIME type
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // Use the API to upload
  const formData = (await import('form-data')).default;
  const form = new formData();
  form.append('file', fileBuffer, {
    filename: fileName,
    contentType: contentType
  });

  const response = await fetch(`${client.baseUrl}images/upload/`, {
    method: 'POST',
    headers: {
      'Authorization': `Ghost ${await generateTokenInternal(client.apiKey)}`,
      'Accept-Version': client.version,
      ...form.getHeaders()
    },
    body: form
  });

  const result = await response.json();

  if (!response.ok || result.errors) {
    throw new Error(result.errors?.[0]?.message || 'Upload failed');
  }

  // Return the URL from Ghost
  return result.images?.[0]?.url || result.url;
}

async function generateTokenInternal(apiKey) {
  const jwt = await import('jsonwebtoken');
  const [id, secret] = apiKey.split(':');
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
    aud: '/admin/',
    kid: id
  };
  const decodedSecret = Buffer.from(secret, 'hex');
  return jwt.default.sign(payload, decodedSecret, { algorithm: 'HS256', keyid: id });
}
