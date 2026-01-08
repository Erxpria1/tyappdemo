
import { GoogleGenAI, Type } from "@google/genai";
import { HairStyleRecommendation } from "../types";

const createClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeStyle = async (
  description: string,
  imageData?: string
): Promise<HairStyleRecommendation[]> => {
  try {
    const ai = createClient();
    // Use flash-image for analysis. If text-only, it still works well for this context.
    const modelId = "gemini-2.5-flash-image"; 

    const promptText = `
      You are a world-class hair stylist and image consultant at the elite "TYRANDEVU" salon.
      Your task is to provide a highly personalized consultation based on the user's photo and description.

      CRITICAL ANALYSIS STEPS:
      1. **Face Shape Analysis:** rigorous analysis of the user's face shape (e.g., Oval, Square, Round, Diamond, Heart).
      2. **Texture Analysis:** Analyze the hair texture (Straight, Wavy, Curly, Coily) and density (Fine, Thick).
      3. **Recommendation:** Suggest 3 distinct, modern hairstyles that aesthetically balance their specific features.
      
      OUTPUT REQUIREMENTS:
      - **description**: Must be detailed and personalized. Explain *WHY* this style works for *their* specific face shape and texture. (e.g., "This textured crop adds volume on top to elongate your round face structure," or "The fade is kept lower to balance your strong jawline.").
      - **faceShapeMatch**: Explicitly state their face shape and why this matches.
      - **maintenanceLevel**: Be realistic based on the cut complexity.

      Return STRICT JSON format (Array of objects). Do not use Markdown code blocks.
    `;

    const parts: any[] = [{ text: promptText }];

    if (imageData) {
      // Remove header if present (data:image/jpeg;base64,...)
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });
    }

    parts.push({ text: `User Description & Preferences: ${description}` });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the hairstyle" },
              description: { type: Type.STRING, description: "Detailed explanation of why this suits the specific user's features" },
              faceShapeMatch: { type: Type.STRING, description: "The detected face shape and the strategy used" },
              maintenanceLevel: { type: Type.STRING, description: "Low, Medium, or High" }
            },
            required: ["name", "description", "faceShapeMatch", "maintenanceLevel"]
          }
        }
      }
    });

    if (response.text) {
      let jsonString = response.text.trim();
      
      // Robust Cleaning: Remove Markdown code blocks if the model includes them despite schema
      if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```json\n?|```$/g, "").trim();
        // Fallback for generic code blocks
        jsonString = jsonString.replace(/^```\n?|```$/g, "").trim();
      }

      try {
        const recommendations = JSON.parse(jsonString) as HairStyleRecommendation[];
        
        // Assign temporary placeholder images initially
        return recommendations.map((rec) => ({
          ...rec,
          imageUrl: `https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop&q=60` // Generic placeholder
        }));
      } catch (parseError) {
        console.error("JSON Parse Error. Raw text:", jsonString);
        throw new Error("AI yanıtı okunamadı. Lütfen tekrar deneyin.");
      }
    }
    
    return [];

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const generateHairstylePreview = async (
  imageData: string,
  styleName: string,
  styleDescription: string
): Promise<string | null> => {
  try {
    const ai = createClient();
    const modelId = "gemini-2.5-flash-image"; 

    // Robust Base64 extraction
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: `Generate a high-resolution, photorealistic makeover of the person in the image.
                   Target Hairstyle: "${styleName}"
                   Style Details: ${styleDescription}
                   
                   CRITICAL REQUIREMENTS FOR PHOTOREALISM:
                   1. PRESERVE IDENTITY: Keep the face, facial features, skin texture, and lighting EXACTLY as they are in the original image.
                   2. REALISTIC HAIR: The generated hair must look indistinguishable from real hair, with individual strands, natural shine, and weight.
                   3. RESOLUTION: Output in 4k/8k quality, sharp details, no blurring or artifacts.
                   4. BLENDING: Ensure the hairline blends naturally with the forehead and skin. Match the lighting on the hair to the original scene.`
          },
        ],
      },
      // DO NOT use responseMimeType: 'application/json' for image generation requests
    });

    // Iterate through candidates to find the image part
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/jpeg;base64,${part.inlineData.data}`;
          }
        }
      }
    }
    
    return null;

  } catch (error) {
    console.error(`Gemini Image Gen Error for ${styleName}:`, error);
    return null;
  }
};
