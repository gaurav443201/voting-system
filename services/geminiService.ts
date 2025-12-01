import { GoogleGenAI } from "@google/genai";
import { Candidate, Block } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateManifesto = async (name: string, dept: string): Promise<string> => {
  try {
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
    const totalVotes = chain.length - 1; // Exclude genesis
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