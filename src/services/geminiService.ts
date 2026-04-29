import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiResponse = async (prompt: string, useSearch = false, isJson = false, schema?: any) => {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const config: any = {
    temperature: 0.7,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  if (isJson) {
    config.responseMimeType = "application/json";
    if (schema) {
      config.responseSchema = schema;
    }
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  return response.text;
};

export const getDailyQuote = async (dateStr: string) => {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `請提供一段適合 ${dateStr} 的簡短聖經金句（繁體中文），格式如下：
  {
    "verse": "經文內容",
    "reference": "出處 (例如：詩篇 23:1)"
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verse: { type: Type.STRING },
          reference: { type: Type.STRING }
        },
        required: ["verse", "reference"]
      }
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { verse: "你的話是我腳前的燈，是我路上的光。", reference: "詩篇 119:105" };
  }
};
export const getDailyReadingInfo = async (dateStr: string) => {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `請查詢推喇奴書房 (Duranno) 『活潑的生命』(Living Life) 在 ${dateStr} 的每日經文進度。
  請回傳 JSON 格式：
  {
    "chapter": "經文章節 (例如：馬太福音 1:1-17)",
    "title": "今日主題/標題",
    "content": "經文全文 (繁體中文)"
  }
  請確保資訊絕對準確，參考官方網站：https://www.duranno.tw/livinglife/index.php/daily`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chapter: { type: Type.STRING },
          title: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["chapter", "title", "content"]
      }
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse daily reading info", e);
    return null;
  }
};
