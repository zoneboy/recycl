import { GoogleGenAI } from "@google/genai";
import { Prediction } from "../types";

export const generateMatchAnalysis = async (prediction: Prediction): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Analysis currently unavailable.";
  } catch (error) {
    console.error("Error generating analysis:", error);
    return "AI Analysis is temporarily unavailable.";
  }
};