import { Prediction } from "../types";

// Helper to determine the correct base URL (same logic as api.ts)
const getApiBase = () => {
  return process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/.netlify/functions/api';
};

export const generateMatchAnalysis = async (prediction: Prediction): Promise<string> => {
  try {
    const apiBase = getApiBase();
    // Call the backend proxy
    const response = await fetch(`${apiBase}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prediction })
    });

    if (!response.ok) {
        throw new Error('Analysis request failed');
    }

    const data = await response.json();
    return data.analysis || "Analysis currently unavailable.";

  } catch (error) {
    console.error("Error fetching analysis:", error);
    return "AI Analysis is temporarily unavailable. Please try again later.";
  }
};