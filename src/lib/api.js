import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { getAuthHeader } from './auth.js';

/**
 * Ghost Admin API Client
 */
export class GhostAdminClient {
  constructor(domain, apiKey, options = {}) {
    this.domain = domain.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.version = options.version || 'v5.0';
    this.baseUrl = `${this.domain}/ghost/api/admin/`;
  }

  /**
   * Make authenticated request to Ghost API
   */
  async request(method, endpoint, data = null, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const headers = {
      'Authorization': `Ghost ${generateTokenInternal(this.apiKey)}`,
      'Accept-Version': this.version,
      'Content-Type': 'application/json'
    };

    const options = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url.toString(), options);
    const text = await response.text();
    const json = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(`Ghost API error: ${response.status} - ${JSON.stringify(json)}`);
    }

    return json;
  }

  // Posts
  async getPosts(params = {}) {
    return this.request('GET', 'posts/', null, params);
  }

  async getPost(id, params = {}) {
    return this.request('GET', `posts/${id}/`, null, params);
  }

  async getPostBySlug(slug, params = {}) {
    return this.request('GET', `posts/slug/${slug}/`, null, params);
  }

  async createPost(data) {
    return this.request('POST', 'posts/', { posts: [data] });
  }

  async updatePost(id, data) {
    // Fetch current post to get updated_at
    const current = await this.getPost(id);
    const post = current.posts[0];
    const updateData = { ...data, updated_at: post.updated_at };
    return this.request('PUT', `posts/${id}/`, { posts: [updateData] });
  }

  async deletePost(id) {
    return this.request('DELETE', `posts/${id}/`);
  }

  // Pages
  async getPages(params = {}) {
    return this.request('GET', 'pages/', null, params);
  }

  async getPage(id, params = {}) {
    return this.request('GET', `pages/${id}/`, null, params);
  }

  async getPageBySlug(slug, params = {}) {
    return this.request('GET', `pages/slug/${slug}/`, null, params);
  }

  async createPage(data) {
    return this.request('POST', 'pages/', { pages: [data] });
  }

  async updatePage(id, data) {
    return this.request('PUT', `pages/${id}/`, { pages: [data] });
  }

  async deletePage(id) {
    return this.request('DELETE', `pages/${id}/`);
  }

  async copyPage(id) {
    return this.request('POST', `pages/${id}/copy`);
  }

  // Images
  async uploadImage(filePath, ref = null) {
    const fs = await import('fs');
    const formData = await import('form-data');
    const fileBuffer = fs.default.readFileSync(filePath);
    const fileName = filePath.split('/').pop();

    const form = new formData.default();
    form.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'image/png'
    });
    if (ref) {
      form.append('ref', ref);
    }

    const response = await fetch(`${this.baseUrl}images/upload/`, {
      method: 'POST',
      headers: {
        'Authorization': `Ghost ${generateTokenInternal(this.apiKey)}`,
        'Accept-Version': this.version,
        ...form.getHeaders()
      },
      body: form
    });

    return response.json();
  }

  // Tags
  async getTags(params = {}) {
    return this.request('GET', 'tags/', null, params);
  }

  async getTag(id) {
    return this.request('GET', `tags/${id}/`);
  }

  async createTag(data) {
    return this.request('POST', 'tags/', { tags: [data] });
  }

  async updateTag(id, data) {
    return this.request('PUT', `tags/${id}/`, { tags: [data] });
  }

  async deleteTag(id) {
    return this.request('DELETE', `tags/${id}/`);
  }

  // Members
  async getMembers(params = {}) {
    return this.request('GET', 'members/', null, params);
  }

  async getMember(id, params = {}) {
    return this.request('GET', `members/${id}/`, null, params);
  }

  // Tiers
  async getTiers(params = {}) {
    return this.request('GET', 'tiers/', null, params);
  }

  // Newsletters
  async getNewsletters(params = {}) {
    return this.request('GET', 'newsletters/', null, params);
  }

  // Site
  async getSite() {
    return this.request('GET', 'site/');
  }
}

// Internal token generation (without domain)
function generateTokenInternal(apiKey) {
  const [id, secret] = apiKey.split(':');

  if (!id || !secret) {
    throw new Error('Invalid API key format. Expected: id:secret');
  }

  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
    aud: '/admin/',
    kid: id
  };

  // Decode secret from hex to binary
  const decodedSecret = Buffer.from(secret, 'hex');

  return jwt.sign(payload, decodedSecret, { algorithm: 'HS256', keyid: id });
}

export function createClient(domain, apiKey, options = {}) {
  return new GhostAdminClient(domain, apiKey, options);
}
