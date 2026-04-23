import test from 'node:test';
import assert from 'node:assert/strict';

import { GhostAdminClient, parseJsonResponse } from '../src/lib/api.js';

test('parseJsonResponse returns parsed JSON bodies', async () => {
  const response = {
    text: async () => JSON.stringify({ ok: true })
  };

  const result = await parseJsonResponse(response);

  assert.deepEqual(result, { ok: true });
});

test('parseJsonResponse preserves non-JSON bodies for error reporting', async () => {
  const response = {
    text: async () => '<html>bad gateway</html>'
  };

  const result = await parseJsonResponse(response);

  assert.deepEqual(result, { raw: '<html>bad gateway</html>' });
});

test('createPage forwards source=html when provided', async () => {
  const client = new GhostAdminClient('https://example.com', 'id:0123456789abcdef0123456789abcdef');
  let call;
  client.request = async (...args) => {
    call = args;
    return { pages: [] };
  };

  await client.createPage({ title: 'Hello', html: '<p>Hi</p>' }, { source: 'html' });

  assert.deepEqual(call, [
    'POST',
    'pages/',
    { pages: [{ title: 'Hello', html: '<p>Hi</p>' }] },
    { source: 'html' }
  ]);
});

test('copyPost uses Ghost copy endpoint', async () => {
  const client = new GhostAdminClient('https://example.com', 'id:0123456789abcdef0123456789abcdef');
  let call;
  client.request = async (...args) => {
    call = args;
    return { posts: [] };
  };

  await client.copyPost('post-id');

  assert.deepEqual(call, ['POST', 'posts/post-id/copy/']);
});
