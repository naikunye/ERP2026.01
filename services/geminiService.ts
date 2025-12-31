import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
// Note: In a production app, handle the missing key more gracefully.
const ai = new GoogleGenAI({ apiKey });

export const generateProductDescription = async (productName: string, features: string, tone: string = 'Professional'): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  try {
    const prompt = `
      You are an expert e-commerce copywriter.
      Write a compelling, SEO-optimized product description for a product named "${productName}".
      Key features to highlight: ${features}.
      Tone: ${tone}.
      Format: Plain text, max 2 paragraphs.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating content. Please check API key.";
  }
};

export const translateProductContent = async (text: string, targetLanguage: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  try {
    const prompt = `Translate the following e-commerce product text into ${targetLanguage}. Maintain the marketing tone. Text: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Translation failed.";
  } catch (error) {
    console.error("Translation Error:", error);
    return "Error translating content.";
  }
};

export const analyzeMarketFit = async (productName: string, price: number): Promise<{ score: number; reasoning: string }> => {
    if (!apiKey) throw new Error("API Key missing");

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze the market fit for a product named "${productName}" priced at ${price}. Return a JSON with a score (1-100) and a short reasoning sentence.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["score", "reasoning"]
                }
            }
        });
        
        const jsonText = response.text;
        if (!jsonText) return { score: 0, reasoning: "No data returned" };
        
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Analysis Error", error);
        return { score: 50, reasoning: "AI Analysis unavailable." };
    }
}
