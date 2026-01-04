import { User, Prediction, PaymentTransaction, BlogPost, PredictionResult, MatchStatus, SubscriptionTier } from '../types';

// Safely check for production environment
const isProd = (import.meta as any).env && (import.meta as any).env.PROD;
const API_URL = isProd ? '/.netlify/functions/api' : '/api';

// Store CSRF token in memory (retrieved on login/register/load)
let _csrfToken = '';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-CSRF-Token': _csrfToken
    // Authorization header removed; using httpOnly cookies via browser credentials
  };
};

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    if (data.csrfToken) _csrfToken = data.csrfToken;
    return data;
  },

  async register(name: string, email: string, phoneNumber: string, password: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phoneNumber, password })
    });
    if (!res.ok) throw new Error('Registration failed');
    const data = await res.json();
    if (data.csrfToken) _csrfToken = data.csrfToken;
    return data;
  },

  async logout() {
    await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders() // Include CSRF for logout as well
    });
    _csrfToken = '';
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send OTP');
    }
    return res.json();
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reset password');
    }
    return res.json();
  },

  async getCurrentUser(): Promise<User | null> {
    try {
        const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            // Store CSRF token if present
            if (data.csrfToken) {
                _csrfToken = data.csrfToken;
                return data.user;
            }
            return data.user || data;
        }
        return null;
    } catch (e) {
        return null;
    }
  },

  // Predictions
  async getPredictions(): Promise<Prediction[]> {
    const res = await fetch(`${API_URL}/predictions`, { headers: getHeaders() });
    return res.ok ? res.json() : [];
  },

  async addPrediction(prediction: Prediction) {
    const res = await fetch(`${API_URL}/predictions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(prediction)
    });
    return res.json();
  },

  async deletePrediction(id: string) {
    await fetch(`${API_URL}/predictions/${id}`, { method: 'DELETE', headers: getHeaders() });
  },

  async updatePredictionStatus(id: string, status: MatchStatus) {
    await fetch(`${API_URL}/predictions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
    });
  },

  async updatePredictionResult(id: string, result: PredictionResult) {
    await fetch(`${API_URL}/predictions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ result })
    });
  },

  // Transactions
  async getTransactions(): Promise<PaymentTransaction[]> {
    const res = await fetch(`${API_URL}/transactions`, { headers: getHeaders() });
    return res.ok ? res.json() : [];
  },

  async addTransaction(transaction: PaymentTransaction) {
    const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(transaction)
    });
    return res.json();
  },

  async updateTransactionStatus(id: string, status: string) {
    await fetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
    });
  },

  // Blog
  async getBlogPosts(): Promise<BlogPost[]> {
      const res = await fetch(`${API_URL}/blog`, { headers: getHeaders() });
      return res.ok ? res.json() : [];
  },

  async addBlogPost(post: BlogPost) {
      await fetch(`${API_URL}/blog`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(post)
      });
  },

  async deleteBlogPost(id: string) {
      await fetch(`${API_URL}/blog/${id}`, { method: 'DELETE', headers: getHeaders() });
  },

  // Users (Admin)
  async getUsers(): Promise<User[]> {
      const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      return res.ok ? res.json() : [];
  },

  async updateUserSubscription(id: string, subscription?: SubscriptionTier, subscriptionExpiryDate?: string | null) {
      await fetch(`${API_URL}/users/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ subscription, subscriptionExpiryDate })
      });
  },

  async deleteUser(id: string) {
      await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: getHeaders() });
  }
};