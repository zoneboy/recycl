import { User, Prediction, PaymentTransaction, BlogPost, PredictionResult, MatchStatus, SubscriptionTier } from '../types';

// Safely check for production environment
const isProd = (import.meta as any).env && (import.meta as any).env.PROD;
const API_URL = isProd ? '/.netlify/functions/api' : '/api';

// Store CSRF token in memory. 
// This is more secure than localStorage as it clears on tab close, 
// and is re-fetched via getCurrentUser on page load.
let _csrfToken = '';

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // If we have a CSRF token, attach it. 
  // The backend requires this for POST/PUT/DELETE.
  if (_csrfToken) {
    headers['X-CSRF-Token'] = _csrfToken;
  }

  // We rely on HttpOnly cookies for the Auth Token, 
  // so we don't strictly need to send Authorization header if the cookie works.
  // However, for backward compatibility if you still use localStorage:
  const localToken = localStorage.getItem('token');
  if (localToken) {
      headers['Authorization'] = `Bearer ${localToken}`;
  }

  return headers;
};

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(err.error || 'Login failed');
    }
    
    const data = await res.json();
    // Capture the CSRF token from the response
    if (data.csrfToken) {
        _csrfToken = data.csrfToken;
    }
    // We don't need to store 'token' in localStorage anymore as it's in a cookie,
    // but we can keep user data if needed.
    return data;
  },

  async register(name: string, email: string, phoneNumber: string, password: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phoneNumber, password })
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(err.error || 'Registration failed');
    }

    const data = await res.json();
    if (data.csrfToken) {
        _csrfToken = data.csrfToken;
    }
    return data;
  },

  async logout() {
    await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders()
    });
    _csrfToken = '';
    localStorage.removeItem('token'); // Clear legacy token if exists
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
        // We attempt to fetch 'me'. The backend will check the Cookie.
        const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            // Important: The backend sends a fresh CSRF token here if valid
            if (data.csrfToken) {
                _csrfToken = data.csrfToken;
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
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add prediction');
    }
    return res.json();
  },

  async deletePrediction(id: string) {
    const res = await fetch(`${API_URL}/predictions/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to delete');
  },

  async updatePredictionStatus(id: string, status: MatchStatus) {
    const res = await fetch(`${API_URL}/predictions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
  },

  async updatePredictionResult(id: string, result: PredictionResult) {
    const res = await fetch(`${API_URL}/predictions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ result })
    });
    if (!res.ok) throw new Error('Failed to update result');
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
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add transaction');
    }
    return res.json();
  },

  async updateTransactionStatus(id: string, status: string) {
    const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update transaction');
  },

  // Blog
  async getBlogPosts(): Promise<BlogPost[]> {
      const res = await fetch(`${API_URL}/blog`, { headers: getHeaders() });
      return res.ok ? res.json() : [];
  },

  async addBlogPost(post: BlogPost) {
      const res = await fetch(`${API_URL}/blog`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(post)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add post');
      }
  },

  async deleteBlogPost(id: string) {
      const res = await fetch(`${API_URL}/blog/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to delete post');
  },

  // Users (Admin)
  async getUsers(): Promise<User[]> {
      const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      return res.ok ? res.json() : [];
  },

  async updateUserSubscription(id: string, subscription?: SubscriptionTier, subscriptionExpiryDate?: string | null) {
      const res = await fetch(`${API_URL}/users/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ subscription, subscriptionExpiryDate })
      });
      if (!res.ok) throw new Error('Failed to update user');
  },

  async deleteUser(id: string) {
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to delete user');
  }
};