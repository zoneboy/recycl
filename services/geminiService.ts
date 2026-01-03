import { Prediction } from "../types";

// Check environment
const isProd = (import.meta as any).env && (import.meta as any).env.PROD;
const API_URL = isProd ? '/.netlify/functions/api' : '/api';

export const generateMatchAnalysis = async (prediction: Prediction): Promise<string> => {
  try {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prediction })
    });

    if (!response.ok) {
        throw new Error("Failed to fetch analysis");
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("Error generating analysis:", error);
    return "AI Analysis is temporarily unavailable. Please try again later.";
  }
};