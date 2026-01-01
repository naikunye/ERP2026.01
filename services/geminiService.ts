import { GoogleGenAI, Type } from "@google/genai";

// Helper to safely get the AI client only when needed.
const getAiClient = () => {
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  return new GoogleGenAI({ apiKey });
};

// --- HELPER: Strip Markdown Code Blocks from JSON ---
const cleanJson = (text: string): string => {
    if (!text) return "{}";
    // Remove ```json and ``` markers
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    // Trim whitespace
    return clean.trim();
};

export const generateProductDescription = async (productName: string, features: string, tone: string = 'Professional'): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `
      You are an expert e-commerce copywriter for the Chinese market.
      Write a compelling, SEO-optimized product description in Chinese (Simplified) for a product named "${productName}".
      Key features to highlight: ${features}.
      Tone: ${tone}.
      Format: Plain text, max 2 paragraphs.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "无法生成描述。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "生成内容出错，请检查配置。";
  }
};

export const optimizeProductTitle = async (productName: string, keywords: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `
            Act as an Amazon/TikTok Shop SEO expert.
            Optimize this product title for maximum click-through rate and search visibility.
            Original Name: "${productName}"
            Keywords to include: "${keywords}"
            Target Audience: Global English speaking market.
            Output: ONLY the optimized title string, no explanation. Max 100 characters.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text?.trim() || productName;
    } catch (error) {
        return productName;
    }
};

export const generateSeoKeywords = async (productName: string, description: string): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const prompt = `
            Analyze this product and generate 10 high-traffic SEO keywords (tags) for e-commerce.
            Product: "${productName}"
            Description: "${description}"
            Output: A JSON array of strings. e.g. ["keyword1", "keyword2"]
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        
        const jsonText = response.text;
        if (!jsonText) return [];
        const data = JSON.parse(cleanJson(jsonText)); // Sanitized
        return data.keywords || [];
    } catch (error) {
        console.error("Keyword Gen Error", error);
        return ["Error", "Retry"];
    }
};

export const translateProductContent = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const ai = getAiClient();
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
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Analyze the market fit for a product named "${productName}" priced at ${price}. Return a JSON with a score (1-100) and a short reasoning sentence in Chinese (Simplified).`,
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
        if (!jsonText) return { score: 0, reasoning: "无数据返回" };
        
        return JSON.parse(cleanJson(jsonText)); // Sanitized
    } catch (error) {
        console.error("Analysis Error", error);
        return { score: 50, reasoning: "AI 分析暂不可用。" };
    }
}

export const generateRestockInsight = async (productName: string, currentStock: number, dailySales: number): Promise<{ suggestedAmount: number; reason: string; riskLevel: string }> => {
    try {
        const ai = getAiClient();
        const prompt = `
            Product: "${productName}"
            Current Stock: ${currentStock} units
            Avg Daily Sales: ${dailySales} units
            
            Act as an inventory management AI. Calculate a suggested restock amount to cover 30 days, considering a 10% safety buffer.
            Determine the risk level (Critical, High, Moderate, Low).
            Provide a very short, strategic reason in Chinese (Simplified) (max 15 words).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedAmount: { type: Type.INTEGER },
                        riskLevel: { type: Type.STRING },
                        reason: { type: Type.STRING }
                    },
                    required: ["suggestedAmount", "riskLevel", "reason"]
                }
            }
        });
        
        const jsonText = response.text;
        if (!jsonText) return { suggestedAmount: 0, reason: "分析失败", riskLevel: "Unknown" };
        
        return JSON.parse(cleanJson(jsonText)); // Sanitized
    } catch (error) {
        console.error("Restock Analysis Error", error);
        return { suggestedAmount: 0, reason: "AI 不可用", riskLevel: "Unknown" };
    }
}