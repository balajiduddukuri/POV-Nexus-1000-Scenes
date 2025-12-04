import { GoogleGenAI, Type } from "@google/genai";
import { SceneConcept, Category } from "../types";
import { SYSTEM_INSTRUCTION, PROMPT_COMPONENTS, LOCATION_CATEGORY_MAP } from "../constants";

// Initialize Gemini Client
// Note: This instance captures the env key at module load time.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * JSON Schema for Structured Output.
 * Ensures the API returns a strictly formatted array of objects.
 */
const sceneSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING },
      category: { type: Type.STRING },
      lighting: { type: Type.STRING },
      camera: { type: Type.STRING }
    },
    required: ["description", "category", "lighting", "camera"]
  }
};

/**
 * Generates a batch of text-based scene concepts using the Gemini API.
 * 
 * @param startId - The ID to start numbering the new scenes from.
 * @param count - The number of scenes to generate in this batch.
 * @param targetCategories - Array of categories to bias the generation towards.
 * @returns Promise<SceneConcept[]> - An array of structured scene objects.
 */
export const generateSceneBatch = async (
  startId: number,
  count: number,
  targetCategories: Category[]
): Promise<SceneConcept[]> => {
  // Always instantiate new client inside the function
  // This is critical for environments where the user provides the key at runtime (BYOK).
  const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) throw new Error("API Key is missing.");

  const model = "gemini-2.5-flash";
  const prompt = `
    Generate ${count} unique POV scene concepts.
    Focus specifically on categories: ${targetCategories.join(", ")}.
    Requirements: 10-20 words each, cinematic, non-repetitive.
    Output JSON array.
  `;

  try {
    const response = await freshAi.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: sceneSchema,
        temperature: 1.2,
      }
    });

    const rawText = response.text;
    if (!rawText) return [];
    const parsedData = JSON.parse(rawText) as Omit<SceneConcept, 'id'>[];

    return parsedData.map((item, index) => ({
      ...item,
      id: startId + index
    }));
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Generates scenes locally without using the API (Instant Mode).
 * Uses pre-defined arrays from constants.ts to construct logical sentences.
 * 
 * @param startId - The ID to start numbering from.
 * @param count - The number of scenes to generate.
 * @returns SceneConcept[] - Array of generated scenes with placeholder thumbnails.
 */
export const generateCuratedBatch = (startId: number, count: number): SceneConcept[] => {
  const scenes: SceneConcept[] = [];
  for (let i = 0; i < count; i++) {
    const mood = PROMPT_COMPONENTS.moods[Math.floor(Math.random() * PROMPT_COMPONENTS.moods.length)];
    const location = PROMPT_COMPONENTS.locations[Math.floor(Math.random() * PROMPT_COMPONENTS.locations.length)];
    const action = PROMPT_COMPONENTS.actions[Math.floor(Math.random() * PROMPT_COMPONENTS.actions.length)];
    const style = PROMPT_COMPONENTS.styles[Math.floor(Math.random() * PROMPT_COMPONENTS.styles.length)];
    
    const category = LOCATION_CATEGORY_MAP[location] || 'General';
    const description = `POV in a ${mood} scene set in ${location}, ${action}. Style: ${style}.`;
    
    const lightingOptions = ['Neon', 'Bioluminescent', 'Volumetric', 'Dusk', 'Cinematic'];
    const lighting = lightingOptions[Math.floor(Math.random() * lightingOptions.length)];
    const camera = 'First-Person POV';

    // Use placeholder images to simulate "pre-populated" low-res thumbnails
    // Using a deterministic random seed based on ID for consistent visuals
    const seed = startId + i;
    const placeholderUrl = `https://picsum.photos/seed/${seed}/400/225`;

    scenes.push({
      id: startId + i,
      description,
      category,
      lighting, 
      camera,
      thumbnailUrl: placeholderUrl
    });
  }
  return scenes;
};

/**
 * Generates a thumbnail image for a specific scene description.
 * Uses 'gemini-2.5-flash-image' for fast, free-tier compatible generation.
 * 
 * @param description - The scene description to visualize.
 * @returns Promise<string | null> - Base64 encoded image string or null.
 */
export const generateSceneThumbnail = async (description: string): Promise<string | null> => {
  // Always instantiate new client to capture potentially newly selected API keys in browser environment
  const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (!process.env.API_KEY) {
    console.error("API Key missing for thumbnail generation");
    throw new Error("API Key is missing");
  }

  try {
    const response = await freshAi.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: { parts: [{ text: description }] },
      // Flash model handles aspect ratio via internal defaults or simple prompts better than explicit complex config
      // Removing strict imageSize to avoid permission/argument errors on free tier
    });
    
    // Find image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Thumbnail gen failed:", error);
    throw error;
  }
};

/**
 * Generates a high-quality image.
 * Currently uses 'gemini-2.5-flash-image' to align with Free Tier requirements.
 * 
 * @param description - The scene description.
 * @returns Promise<string | null> - Base64 encoded image string or null.
 */
export const generateHighQualityImage = async (description: string): Promise<string | null> => {
  // Always instantiate new client to capture potentially newly selected API keys in browser environment
  const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (!process.env.API_KEY) {
    console.error("API Key missing for high-res generation");
    throw new Error("API Key is missing");
  }

  try {
    const response = await freshAi.models.generateContent({
      model: 'gemini-2.5-flash-image', // Fallback to Flash to avoid 403 on Pro
      contents: { parts: [{ text: description }] },
      // Removed imageSize: '2K' as it triggers PERMISSION_DENIED on keys without Pro access
    });
    
    // Find image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image gen failed:", error);
    throw error;
  }
};