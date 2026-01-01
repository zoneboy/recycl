import { GoogleGenAI } from "@google/genai";
import { Prediction } from "../types";

// Helper to safely get the API key without crashing if process is undefined
const getApiKey = () => {
  try {
    return process.env.API_KEY;
  } catch (e) {
    return undefined;
  }
};

export const generateMatchAnalysis = async (prediction: Prediction): Promise<string> => {
  const apiKey = getApiKey();

  // Safety check: Don't attempt to call API if key is missing
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Returning placeholder analysis.");
    return "AI Analysis is currently unavailable. Please configure the API Key to enable this feature.";
  }

  try {
    // Initialize lazily to avoid top-level errors
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Act as a professional football analyst for the Nigerian betting market.
      Analyze the following match:
      League: ${prediction.league}
      Match: ${prediction.homeTeam} vs ${prediction.awayTeam}
      Date: ${prediction.date}
      Current Tip: ${prediction.tip}
      
      Provide a concise, 2-paragraph analysis explaining why this tip is likely to win. 
      Focus on recent form, head-to-head stats, and key players. 
      Keep the tone confident and professional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Using a standard flash model available
      contents: prompt,
    });

    return response.text || "Analysis currently unavailable. Please check back later.";
  } catch (error) {
    console.error("Error generating analysis:", error);
    return "AI Analysis is temporarily unavailable due to high demand or connection issues. Please try again.";
  }
};