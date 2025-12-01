import { GoogleGenAI } from "@google/genai";
import { Candidate, Block } from '../types';

// Helper to safely get the AI client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateManifesto = async (name: string, dept: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) return "Vote for progress and unity!";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, catchy, 2-sentence election manifesto for a student named ${name} running for Class Representative in the ${dept} department. Keep it professional but energetic.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Vote for progress and unity!";
  }
};

export const analyzeResults = async (candidates: Candidate[], chain: Block[], winner: Candidate): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) return "AI Analysis unavailable (API Key missing).";

    const totalVotes = Math.max(0, chain.length - 1); 
    const prompt = `
      Analyze these student election results:
      Total Votes Cast: ${totalVotes}
      Winner: ${winner.name} (${winner.department})
      
      Candidates:
      ${candidates.map(c => `- ${c.name}: ${c.voteCount} votes`).join('\n')}

      Provide a brief 3-sentence summary of the election outcome, commenting on the voter turnout or margin of victory. Professional tone.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analysis unavailable at this time.";
  }
};