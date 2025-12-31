import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Ensure this is available in your environment

// Initialize Gemini
// Note: In a real production app, you might want to proxy this through a backend to hide the key,
// but for this SPA demo, we assume the environment variable is injected safely or user provided.
// Since the prompt instructs not to ask for key if not needed, we assume process.env.API_KEY is there.
const ai = new GoogleGenAI({ apiKey });

export const getDailyMotivation = async (): Promise<{ message: string; title: string }> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: "Generate a short, powerful, sports-psychology based motivational title and a 2-sentence description for an athlete who needs to train today. Return as JSON.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            message: { type: Type.STRING }
          },
          required: ["title", "message"]
        }
      }
    });

    const text = response.text;
    if (!text) return { title: "TU MOMENTO", message: "La disciplina supera a la motivación." };
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: "ENFOQUE TOTAL",
      message: "Hoy es un buen día para superar tus límites. No te detengas."
    };
  }
};