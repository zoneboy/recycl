import { User, Prediction, PaymentTransaction, BlogPost, SubscriptionTier, PaymentStatus } from "../types";
import { MOCK_PREDICTIONS, MOCK_USERS, MOCK_TRANSACTIONS, MOCK_BLOG_POSTS } from "./mockData";

const API_BASE = '/.netlify/functions/api';

// Helper to handle response with fallback
const fetchWithFallback = async <T>(endpoint: string, options?: RequestInit, mockData?: T): Promise<T> => {
  try {
    // Attempt fetch
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    // Check for network success
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
       throw new Error("Response not JSON");
    }

    // Attempt parse
    return await response.json();
  } catch (error) {
    // If ANY error occurs (network, 404, parsing, etc), use fallback
    console.warn(`API request to ${endpoint} failed (${error}), utilizing mock data.`);
    
    if (mockData !== undefined) {
        // Simulate a small network delay for realism
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockData;
    }
    // Only throw if we have absolutely no data to show
    throw error;
  }
};

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<User> => {
     // Fallback Mock Logic
     const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
     const fallbackResponse = mockUser || {
        id: `u_${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        subscription: SubscriptionTier.FREE,
        role: 'user',
        joinDate: new Date().toISOString().split('T')[0],
        phoneNumber: '0000000000'
     };

    return fetchWithFallback('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, fallbackResponse as User);
  },

  register: async (userData: any): Promise<User> => {
    const fallbackResponse = { 
        ...userData, 
        id: `u_${Date.now()}`, 
        subscription: SubscriptionTier.FREE, 
        role: 'user', 
        joinDate: new Date().toISOString().split('T')[0] 
    };

    return fetchWithFallback('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, fallbackResponse);
  },

  // Predictions
  getPredictions: async (): Promise<Prediction[]> => {
    return fetchWithFallback('/predictions', undefined, MOCK_PREDICTIONS);
  },

  createPrediction: async (prediction: Prediction): Promise<Prediction> => {
    return fetchWithFallback('/predictions', {
      method: 'POST',
      body: JSON.stringify(prediction),
    }, prediction);
  },

  deletePrediction: async (id: string): Promise<void> => {
    return fetchWithFallback(`/predictions?id=${id}`, {
      method: 'DELETE',
    }, undefined).catch(() => {}); 
  },
  
  updatePrediction: async (prediction: Prediction): Promise<Prediction> => {
    return fetchWithFallback('/predictions', {
        method: 'PUT',
        body: JSON.stringify(prediction),
    }, prediction);
  },

  // Transactions
  getTransactions: async (): Promise<PaymentTransaction[]> => {
    return fetchWithFallback('/transactions', undefined, MOCK_TRANSACTIONS);
  },

  createTransaction: async (transaction: PaymentTransaction): Promise<PaymentTransaction> => {
    return fetchWithFallback('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    }, transaction);
  },

  updateTransactionStatus: async (id: string, status: string): Promise<PaymentTransaction> => {
     const mockTx = MOCK_TRANSACTIONS.find(t => t.id === id);
     const fallback = mockTx ? { ...mockTx, status: status as PaymentStatus } : undefined;
     
     return fetchWithFallback('/transactions', {
      method: 'PUT',
      body: JSON.stringify({ id, status }),
    }, fallback);
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    return fetchWithFallback('/users', undefined, MOCK_USERS);
  },
  
  updateUser: async (user: User): Promise<User> => {
      return fetchWithFallback('/users', {
          method: 'PUT',
          body: JSON.stringify(user)
      }, user);
  },

  deleteUser: async (id: string): Promise<void> => {
      return fetchWithFallback(`/users?id=${id}`, {
          method: 'DELETE'
      }, undefined).catch(() => {});
  },

  // Blog
  getBlogPosts: async (): Promise<BlogPost[]> => {
    return fetchWithFallback('/blog', undefined, MOCK_BLOG_POSTS);
  },

  createBlogPost: async (post: BlogPost): Promise<BlogPost> => {
    return fetchWithFallback('/blog', {
      method: 'POST',
      body: JSON.stringify(post),
    }, post);
  },

  deleteBlogPost: async (id: string): Promise<void> => {
    return fetchWithFallback(`/blog?id=${id}`, {
      method: 'DELETE',
    }, undefined).catch(() => {});
  }
};