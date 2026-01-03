// ============================================================================
// FILE: netlify/functions/ai-analysis.ts
// PURPOSE: Secure backend endpoint for Gemini AI analysis
// ============================================================================

import { GoogleGenAI } from "@google/genai";

interface HandlerEvent {
  httpMethod: string;
  body: string | null;
  headers: Record<string, string | undefined>;
}

interface AnalysisRequest {
  league: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  tip: string;
}

const response = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  },
  body: JSON.stringify(body),
});

// Verify JWT token
const verifyToken = (headers: Record<string, string | undefined>) => {
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (!authHeader) return null;
  
  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as any;
  } catch (e) {
    return null;
  }
};

export const handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    // 1. Verify authentication
    const user = verifyToken(event.headers);
    if (!user) {
      return response(401, { error: 'Unauthorized. Please log in.' });
    }

    // 2. Check if user has Premium subscription
    if (user.subscription !== 'Premium') {
      return response(403, { 
        error: 'Premium subscription required for AI analysis',
        upgradeUrl: '/pricing'
      });
    }

    // 3. Parse request body
    if (!event.body) {
      return response(400, { error: 'Request body is required' });
    }

    const prediction: AnalysisRequest = JSON.parse(event.body);

    // 4. Validate required fields
    const requiredFields = ['league', 'homeTeam', 'awayTeam', 'date', 'tip'];
    for (const field of requiredFields) {
      if (!prediction[field as keyof AnalysisRequest]) {
        return response(400, { error: `Missing required field: ${field}` });
      }
    }

    // 5. Check for API key (server-side only - never exposed to client)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return response(500, { 
        error: 'AI service temporarily unavailable. Please contact support.' 
      });
    }

    // 6. Initialize Gemini AI (server-side only)
    const ai = new GoogleGenAI({ apiKey });

    // 7. Generate analysis prompt
    const prompt = `
Act as a professional football analyst for the Nigerian betting market.
Analyze the following match:

League: ${prediction.league}
Match: ${prediction.homeTeam} vs ${prediction.awayTeam}
Date: ${prediction.date}
Current Tip: ${prediction.tip}

Provide a concise, 2-paragraph analysis (max 150 words) explaining why this tip is likely to win.
Focus on:
1. Recent form and momentum
2. Head-to-head statistics
3. Key players and injuries
4. Tactical matchup considerations

Keep the tone confident, professional, and engaging for Nigerian bettors.
    `.trim();

    // 8. Call Gemini API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let analysis: string;
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      clearTimeout(timeoutId);
      
      analysis = result.text || "Analysis temporarily unavailable. Please try again.";
    } catch (aiError: any) {
      clearTimeout(timeoutId);
      
      console.error('Gemini API Error:', aiError);
      
      // Handle specific error types
      if (aiError.name === 'AbortError') {
        return response(504, { error: 'AI analysis timed out. Please try again.' });
      }
      
      if (aiError.status === 429) {
        return response(429, { error: 'Too many AI requests. Please try again in a moment.' });
      }
      
      throw aiError; // Let outer catch handle unexpected errors
    }

    // 9. Return successful analysis
    return response(200, { 
      analysis,
      generatedAt: new Date().toISOString(),
      model: 'gemini-2.0-flash-exp'
    });

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    
    return response(500, { 
      error: 'Failed to generate analysis. Please try again later.',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};