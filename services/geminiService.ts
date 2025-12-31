import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
// Note: In a production app, handle the missing key more gracefully.
const ai = new GoogleGenAI({ apiKey });

export const generateProductDescription = async (productName: string, features: string, tone: string = 'Professional'): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  try {
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
    return "生成内容出错，请检查 API Key。";
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
        
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Analysis Error", error);
        return { score: 50, reasoning: "AI 分析暂不可用。" };
    }
}

export const generateRestockInsight = async (productName: string, currentStock: number, dailySales: number): Promise<{ suggestedAmount: number; reason: string; riskLevel: string }> => {
    if (!apiKey) throw new Error("API Key missing");

    try {
        const prompt = `
            Product: "${productName}"
            Current Stock: ${currentStock} units
            Avg Daily Sales: ${dailySales} units
            
            Act as an inventory management AI. Calculate a suggested restock amount to cover 30 days, considering a 10% safety buffer.
            Determine the risk level (Critical, High, Moderate, Low).
            Provide a very short, strategic reason in Chinese (Simplified) (max 15 words).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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
        
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Restock Analysis Error", error);
        return { suggestedAmount: 0, reason: "AI 不可用", riskLevel: "Unknown" };
    }
}