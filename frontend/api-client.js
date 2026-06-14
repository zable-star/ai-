// API Client for backend communication
(function(globalScope) {
  "use strict";

  const API_BASE_URL = 'http://localhost:3000/api';

  class ApiClient {
    constructor() {
      this.baseUrl = API_BASE_URL;
    }

    // Get token from localStorage
    getToken() {
      return localStorage.getItem('authToken');
    }

    // Set token to localStorage
    setToken(token) {
      localStorage.setItem('authToken', token);
    }

    // Remove token from localStorage
    removeToken() {
      localStorage.removeItem('authToken');
    }

    // Make API request
    async request(endpoint, options = {}) {
      const url = `${this.baseUrl}${endpoint}`;
      const token = this.getToken();

      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      if (token && !options.noAuth) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config = {
        ...options,
        headers
      };

      try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Request failed');
        }

        return data;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    }

    // Auth endpoints
    async register(username, password) {
      const data = await this.request('/auth/register', {
        method: 'POST',
        noAuth: true,
        body: JSON.stringify({ username, password })
      });
      if (data.success && data.data.token) {
        this.setToken(data.data.token);
      }
      return data;
    }

    async login(username, password) {
      const data = await this.request('/auth/login', {
        method: 'POST',
        noAuth: true,
        body: JSON.stringify({ username, password })
      });
      if (data.success && data.data.token) {
        this.setToken(data.data.token);
      }
      return data;
    }

    async getCurrentUser() {
      return await this.request('/auth/me');
    }

    logout() {
      this.removeToken();
    }

    // Model profile endpoints
    async getModelProfiles() {
      return await this.request('/models');
    }

    async createModelProfile(profile) {
      return await this.request('/models', {
        method: 'POST',
        body: JSON.stringify(profile)
      });
    }

    async updateModelProfile(id, updates) {
      return await this.request(`/models/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    }

    async deleteModelProfile(id) {
      return await this.request(`/models/${id}`, {
        method: 'DELETE'
      });
    }

    // AI chat endpoint
    async chat(messages, profileId = null, temperature = 0.1) {
      return await this.request('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages,
          profileId,
          temperature
        })
      });
    }

    async refineImage({ prompt, canvasImage = null, profileId = null, size = '1024x1024', referenceMode = 'redraw' }) {
      return await this.request('/ai/refine-image', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          canvasImage,
          profileId,
          size,
          referenceMode,
          responseFormat: 'b64_json'
        })
      });
    }

    // Drawing endpoints
    async getDrawings(limit = 50, offset = 0) {
      return await this.request(`/drawings?limit=${limit}&offset=${offset}`);
    }

    async getDrawing(id) {
      return await this.request(`/drawings/${id}`);
    }

    async createDrawing(name, actions, thumbnail = null) {
      return await this.request('/drawings', {
        method: 'POST',
        body: JSON.stringify({ name, actions, thumbnail })
      });
    }

    async updateDrawing(id, updates) {
      return await this.request(`/drawings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    }

    async deleteDrawing(id) {
      return await this.request(`/drawings/${id}`, {
        method: 'DELETE'
      });
    }

    // Check if user is authenticated
    isAuthenticated() {
      return !!this.getToken();
    }
  }

  // Export to global scope
  globalScope.ApiClient = ApiClient;
  globalScope.apiClient = new ApiClient();

})(window);
