
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Activity } from "../types";

/**
 * Robust wrapper to handle API calls with exponential backoff.
 * Especially useful for 429 (Rate Limit) errors.
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429;
    if (retries > 0 && isRateLimit) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const getCoachInsights = async (activities: Activity[]) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY ?? import.meta.env.VITE_API_KEY });
  
  const totalAthletes = activities.reduce((acc, curr) => acc + 1 + (curr.participants?.length || 0), 0);
  const squadRuns = activities.filter(a => (a.participants?.length || 0) > 0).length;

  const prompt = `
    You are the "Run Stupid" Pack Leader. Your philosophy is that shared suffering is better than solo suffering.
    Your tone is punchy, high-energy, and focuses on the power of the "Squad" and the "Pack".
    
    Stats for context:
    - Total athletes seen today: ${totalAthletes}
    - Group activities: ${squadRuns}
    
    Task: Write a 1-sentence "Pack Insight" for the group feed. Use Google Search to check if there are any major running events or weather patterns that might affect "stupid runners" today.
  `;

  try {
    // Explicitly type response to GenerateContentResponse to fix unknown property access errors
    const response = await callWithRetry<GenerateContentResponse>(() => 
      ai.models.generateContent({
        // Switched from Pro to Flash for significantly better rate limits/quota
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      })
    );
    
    // Extract grounding chunks for compliance with Google Search tool requirements
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = chunks.map((c: any) => c.web?.uri).filter(Boolean);

    return {
      text: response.text || "The pack is active. Get out there and embrace the shared grind.",
      links
    };
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {
      text: "The pack is active. Get out there and embrace the shared grind.",
      links: []
    };
  }
};

export const discoverStupidRoutes = async (lat?: number, lng?: number) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY ?? import.meta.env.VITE_API_KEY });
  
  const prompt = `Find 3 running-friendly locations, trails, or parks specifically in the Vaal region (Vanderbijlpark, Sasolburg, or along the Vaal River). 
  Explain why they are "stupidly good" for a run. Include specific place names and why the "Pack" would love them.`;

  try {
    // Explicitly type response to GenerateContentResponse to fix unknown property access errors
    const response = await callWithRetry<GenerateContentResponse>(() =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { 
                latitude: lat || -26.7000, 
                longitude: lng || 27.8333 
              }
            }
          }
        },
      })
    );
    
    // Extract grounding chunks for compliance with Google Maps tool requirements
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const urls = chunks.map((c: any) => c.maps?.uri).filter(Boolean);
    
    return {
      text: response.text || "Could not find Vaal routes. Just run toward the river!",
      links: urls
    };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return { text: "Could not find Vaal routes. Just run toward the river!", links: [] };
  }
};
