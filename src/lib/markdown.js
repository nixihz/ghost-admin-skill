import { marked } from 'marked';

/**
 * Convert Markdown content to HTML
 * @param {string} markdown - Markdown content
 * @returns {string} HTML content
 */
export function markdownToHtml(markdown) {
  if (!markdown) return '';
  return marked.parse(markdown);
}

/**
 * Check if content appears to be HTML (contains HTML tags)
 * @param {string} content - Content to check
 * @returns {boolean}
 */
export function isHtml(content) {
  if (!content) return false;
  return /<[a-z][\s\S]*>/i.test(content);
}

/**
 * Convert content to HTML if it's Markdown, pass through if already HTML
 * @param {string} content - Content in Markdown or HTML format
 * @returns {string} HTML content
 */
export function ensureHtml(content) {
  if (!content) return '';
  if (isHtml(content)) return content;
  return markdownToHtml(content);
}
