
import { GoogleGenAI, Type } from '@google/genai';
import type { AttachedFile, Suggestion, Platform } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const suggestionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      originalText: {
        type: Type.STRING,
        description: 'The exact original text from the document that should be replaced.',
      },
      suggestedChange: {
        type: Type.STRING,
        description: 'The new text that should replace the original.',
      },
      reason: {
        type: Type.STRING,
        description: 'A brief, user-friendly explanation for why this change is suggested.',
      },
    },
    required: ['originalText', 'suggestedChange', 'reason'],
  },
};

const getPlatformInstructions = (platform: Platform): string => {
    switch (platform) {
        case 'LinkedIn':
            return "Tailor the writing for LinkedIn. Use a professional but conversational tone. Structure the post with short paragraphs and plenty of white space for easy readability on mobile devices. Use 2-3 relevant hashtags at the end.";
        case 'Facebook':
            return "Tailor the writing for Facebook. Use a friendly, engaging, and personal tone. Feel free to use emojis where appropriate. Aim for a balance between informative and entertaining.";
        case 'Reddit':
            return "Tailor the writing for Reddit. The tone should be authentic and community-focused. Match the style of a typical subreddit post. Be direct and avoid corporate jargon.";
        case 'Twitter':
            return "Tailor the writing for Twitter (X). Keep the message concise and impactful, well under the character limit. Use relevant hashtags and a strong hook.";
        case 'Generic':
        default:
            return "Write in a clear, general-purpose style suitable for a blog post or article.";
    }
};

const fileToGenerativePart = (file: AttachedFile) => {
  const base64Data = file.content.split(',')[1];
  return {
    inlineData: {
      mimeType: file.type,
      data: base64Data,
    },
  };
};

export const generateInitialDraft = async (prompt: string, files: AttachedFile[], platform: Platform): Promise<string> => {
  const parts: any[] = files.map(fileToGenerativePart);
  parts.push({ text: `User prompt: ${prompt}\n\nPlease write the document based on the prompt and any provided files.` });

  const systemInstruction = `You are a world-class ghostwriter. Your goal is to create content that is engaging, authentic, and sounds like it was written by a human, not an AI. Avoid robotic phrasing and complex sentence structures.
${getPlatformInstructions(platform)}`;

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: { parts },
    config: {
      systemInstruction,
    },
  });
  return result.text;
};

export const generateSuggestions = async (documentContent: string, platform: Platform): Promise<Suggestion[]> => {
  const prompt = `
    You are an expert writing assistant. Analyze the following document, keeping in mind its target platform is ${platform}. 
    Provide specific, actionable suggestions to improve it. Focus on clarity, conciseness, grammar, tone, and overall impact, according to the platform's best practices.
    For each suggestion, provide the original text to be changed, your suggested replacement, and a brief reason.
    Return the suggestions in the specified JSON format. If there are no suggestions, return an empty array.

    Document:
    ---
    ${documentContent}
    ---
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: suggestionSchema,
      },
    });

    const jsonText = result.text;
    const suggestionsData = JSON.parse(jsonText) as Omit<Suggestion, 'id'>[];
    
    return suggestionsData.map((s, index) => ({ ...s, id: `${Date.now()}-${index}` }));
  } catch (error) {
    console.error("Error parsing Gemini's suggestion response:", error);
    return []; 
  }
};

export const applySuggestions = async (documentContent: string, suggestions: Suggestion[], platform: Platform): Promise<string> => {
  const changesList = suggestions
    .map(s => `- Replace "${s.originalText}" with "${s.suggestedChange}". Reason: ${s.reason}`)
    .join('\n');

  const prompt = `
    You are an expert editor. Below is a document and a list of requested changes. 
    Your task is to integrate these changes seamlessly into a revised version of the document.
    The final piece is intended for ${platform}, so ensure the final text flows naturally, maintains a consistent tone, and is well-formatted for that platform.
    Return only the full, revised document content.

    Original Document:
    ---
    ${documentContent}
    ---

    Changes to Apply:
    ---
    ${changesList}
    ---
  `;

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
  });
  return result.text;
};
