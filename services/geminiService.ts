// ============================================================================
// FILE: src/services/geminiService.ts
// PURPOSE: Frontend service to call secure backend AI analysis
// ============================================================================

import { Prediction } from "../types";

// Detect environment
const isProd = (import.meta as any).env && (import.meta as any).env.PROD;
const API_URL = isProd ? '/.netlify/functions/ai-analysis' : '/api/ai-analysis';

/**
 * Generate match analysis using secure backend endpoint
 * @param prediction - The prediction to analyze
 * @returns Analysis text or error message
 */
export const generateMatchAnalysis = async (prediction: Prediction): Promise<string> => {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      return "Please log in to access AI analysis.";
    }

    // Prepare request payload
    const payload = {
      league: prediction.league,
      homeTeam: prediction.homeTeam,
      awayTeam: prediction.awayTeam,
      date: prediction.date,
      tip: prediction.tip
    };

    // Call secure backend endpoint
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    // Handle different response status codes
    if (response.status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (response.status === 403) {
      return "Premium subscription required for AI analysis. Upgrade to unlock this feature!";
    }

    if (response.status === 429) {
      return "Too many AI requests. Please wait a moment and try again.";
    }

    if (response.status === 504) {
      return "AI analysis timed out. Please try again.";
    }

    if (!response.ok) {
      const error = await response.json();
      console.error('AI Analysis Error:', error);
      return error.error || "AI Analysis temporarily unavailable. Please try again later.";
    }

    // Parse successful response
    const data = await response.json();
    return data.analysis || "Analysis generated successfully but content unavailable.";

  } catch (error: any) {
    console.error("Error calling AI analysis:", error);
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return "Network error. Please check your internet connection.";
    }
    
    return "AI Analysis is temporarily unavailable. Please try again later.";
  }
};

/**
 * Check if AI analysis is available for current user
 * @param userSubscription - User's current subscription tier
 * @returns boolean indicating availability
 */
export const isAIAnalysisAvailable = (userSubscription: string): boolean => {
  return userSubscription === 'Premium';
};

/**
 * Get AI analysis quota information (for future implementation)
 * @returns Quota details
 */
export const getAIAnalysisQuota = async (): Promise<{ remaining: number; limit: number } | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await fetch(`${API_URL}/quota`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch {
    return null;
  }
};