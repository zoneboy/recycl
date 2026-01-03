/// <reference types="vite/client" />
import { User, Prediction, PaymentTransaction, BlogPost, PredictionResult, MatchStatus, SubscriptionTier } from '../types';

// Safely check for production environment to prevent "Cannot read properties of undefined (reading 'PROD')"
const isProd = import.meta.env && import.meta.env.PROD;
const API_URL = isProd ? '/.netlify/functions/api' : '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User, token: string }> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async register(name: string, email: string, phoneNumber: string, password: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phoneNumber, password })
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
        if (res.ok) return res.json();
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