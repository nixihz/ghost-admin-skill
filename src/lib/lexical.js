import { marked } from 'marked';

/**
 * Convert Markdown to Ghost's Lexical JSON format
 * @param {string} markdown - Markdown content
 * @returns {string} Lexical JSON string
 */
export function markdownToLexical(markdown) {
  if (!markdown) return createEmptyLexical();

  const tokens = marked.lexer(markdown);
  const children = tokens
    .filter(token => token.type !== 'space')
    .map(tokenToLexical)
    .filter(Boolean);

  if (children.length === 0) {
    children.push(createParagraph([createText('')]));
  }

  return JSON.stringify({
    root: {
      children,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  });
}

function tokenToLexical(token) {
  switch (token.type) {
    case 'heading':
      return createHeading(token.depth, token.tokens || [{ type: 'text', text: token.text }]);
    case 'paragraph':
      return createParagraph(processInlineTokens(token.tokens || [{ type: 'text', text: token.text }]));
    case 'strong':
      return createParagraph(processInlineTokens(token.tokens || [{ type: 'text', text: token.text }], { bold: true }));
    case 'em':
      return createParagraph(processInlineTokens(token.tokens || [{ type: 'text', text: token.text }], { italic: true }));
    case 'codespan':
      return createParagraph([createText(token.text, { code: true })]);
    case 'link':
      return createParagraph([createLink(token.href, processInlineTokens(token.tokens || [{ type: 'text', text: token.text }]))]);
    case 'list':
      return createList(token.ordered, token.items);
    case 'blockquote':
      return createBlockquote(processInlineTokens(token.tokens || [{ type: 'text', text: token.text }]));
    case 'code':
      return createCodeBlock(token.text, token.lang);
    case 'hr':
      return createHorizontalRule();
    case 'table':
      return createTable(token.header, token.rows);
    case 'def':
      // Skip definition tokens
      return null;
    case 'html':
      // Pass through HTML as paragraph
      return createParagraph([createText(token.raw)]);
    case 'text':
      return createParagraph([createText(token.text)]);
    default:
      // Handle unknown tokens as paragraphs
      if (token.text) {
        return createParagraph(processInlineTokens(token.tokens || [{ type: 'text', text: token.text }]));
      }
      return null;
  }
}

function processInlineTokens(tokens, parentMarks = {}) {
  if (!tokens || !Array.isArray(tokens)) {
    return [createText('')];
  }

  const result = [];
  for (const token of tokens) {
    if (token.type === 'text') {
      result.push(createText(token.text, parentMarks));
    } else if (token.type === 'strong') {
      const marks = { ...parentMarks, bold: true };
      result.push(...processInlineTokens(token.tokens || [{ type: 'text', text: token.text }], marks));
    } else if (token.type === 'em') {
      const marks = { ...parentMarks, italic: true };
      result.push(...processInlineTokens(token.tokens || [{ type: 'text', text: token.text }], marks));
    } else if (token.type === 'codespan') {
      result.push(createText(token.text, { ...parentMarks, code: true }));
    } else if (token.type === 'link') {
      result.push(createLink(token.href, processInlineTokens(token.tokens || [{ type: 'text', text: token.text }], parentMarks)));
    } else if (token.type === 'html') {
      result.push(createText(token.raw, parentMarks));
    } else if (token.text) {
      result.push(createText(token.text, parentMarks));
    }
  }

  if (result.length === 0) {
    return [createText('')];
  }

  return result;
}

function createEmptyLexical() {
  return JSON.stringify({
    root: {
      children: [createParagraph([])],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  });
}

function createParagraph(children) {
  return {
    children: children || [createText('')],
    direction: null,
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1
  };
}

function createText(text, marks = {}) {
  const result = {
    text: text || '',
    type: 'text',
    version: 1
  };
  if (marks.bold) result.bold = true;
  if (marks.italic) result.italic = true;
  if (marks.underline) result.underline = true;
  if (marks.strikethrough) result.strikethrough = true;
  if (marks.code) result.code = true;
  return result;
}

function createLink(href, children) {
  return {
    type: 'link',
    version: 1,
    href: href || '',
    children: children.length > 0 ? children : [createText(href || '')]
  };
}

function createHeading(depth, tokens) {
  return {
    children: processInlineTokens(tokens),
    direction: null,
    format: '',
    indent: 0,
    type: 'heading',
    version: 1,
    tag: `h${depth}`,
    headerStyle: ''
  };
}

function createList(ordered, items) {
  return {
    children: items.map(item => {
      // items can be list_item tokens or objects with text property
      if (item.type === 'list_item') {
        return {
          children: [createParagraph(processInlineTokens(item.tokens || [{ type: 'text', text: item.text }]))],
          direction: null,
          format: '',
          indent: 0,
          type: 'list-item',
          version: 1
        };
      }
      // Fallback for string or simple object
      const text = typeof item === 'string' ? item : (item.text || '');
      return {
        children: [createParagraph([createText(text)])],
        direction: null,
        format: '',
        indent: 0,
        type: 'list-item',
        version: 1
      };
    }),
    direction: null,
    format: '',
    indent: 0,
    type: 'list',
    version: 1,
    listType: ordered ? 'ordered' : 'bullet'
  };
}

function createBlockquote(tokens) {
  return {
    children: [createParagraph(processInlineTokens(tokens))],
    direction: null,
    format: '',
    indent: 0,
    type: 'quote',
    version: 1
  };
}

function createCodeBlock(code, language) {
  return {
    children: [createText(code)],
    direction: null,
    format: '',
    indent: 0,
    type: 'code',
    version: 1,
    language: language || 'plaintext'
  };
}

function createHorizontalRule() {
  return {
    children: [createText('')],
    direction: null,
    format: '',
    indent: 0,
    type: 'horizontalrule',
    version: 1
  };
}

function createTable(headerCells, rows) {
  // Convert markdown table to Lexical table format
  const tableChildren = [];

  // Header row
  if (headerCells) {
    tableChildren.push({
      children: headerCells.map(cell => ({
        children: [createParagraph(processInlineTokens(cell.tokens || [{ type: 'text', text: cell.text || '' }]))],
        direction: null,
        format: '',
        indent: 0,
        type: 'table-cell',
        version: 1,
        tag: 'th'
      })),
      direction: null,
      format: '',
      indent: 0,
      type: 'table-row',
      version: 1
    });
  }

  // Data rows
  if (rows) {
    rows.forEach(row => {
      tableChildren.push({
        children: (row || []).map(cell => ({
          children: [createParagraph(processInlineTokens(cell.tokens || [{ type: 'text', text: cell.text || '' }]))],
          direction: null,
          format: '',
          indent: 0,
          type: 'table-cell',
          version: 1,
          tag: 'td'
        })),
        direction: null,
        format: '',
        indent: 0,
        type: 'table-row',
        version: 1
      });
    });
  }

  return {
    children: tableChildren,
    direction: null,
    format: '',
    indent: 0,
    type: 'table',
    version: 1,
    colCount: (headerCells || []).length,
    tableWidth: '100%'
  };
}

/**
 * Create a slug from title
 * @param {string} title - Post title
 * @param {string} date - Date string (YYYY-MM-DD format)
 * @returns {string} Clean slug
 */
export function createSlug(title, date = null) {
  // Use provided date or current date
  const dateStr = date || new Date().toISOString().split('T')[0];

  // Extract key words from title (remove common Chinese particles and punctuation)
  const keyWords = extractKeyWords(title);

  // Combine date and key words
  return `${dateStr}-${keyWords}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function extractKeyWords(title) {
  // For Chinese titles, extract significant characters
  // Remove common particles and punctuation
  const cleaned = title
    .replace(/[#*_`~\[\]（）()【】{}|\\<>:;"'，,。.！!？?…—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // For mixed Chinese/English, try to keep English words
  const words = cleaned.split(' ').filter(w => w.length > 0);

  // Take first 5 significant words/segments
  const keyWords = words.slice(0, 5).map(w => {
    // Convert to lowercase and remove non-alphanumeric
    return w.toLowerCase().replace(/[^a-z0-9]/g, '');
  }).filter(w => w.length > 1);

  return keyWords.join('-');
}
