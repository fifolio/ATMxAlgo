import { GoogleGenAI } from "@google/genai";


const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function AI_model(prompt: string) {

  // Wait 1 minutes
  await new Promise(resolve => setTimeout(resolve, 60000));

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });
  return response.text;
}


export default AI_model;
