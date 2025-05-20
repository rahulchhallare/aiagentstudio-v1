import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * A simplified test function to directly generate content with OpenAI
 * This bypasses the complex flow execution system for testing purposes
 */
export async function testOpenAIExecution(prompt: string): Promise<{
  success: boolean;
  output?: string;
  error?: string;
}> {
  try {
    // Simple OpenAI call to test connectivity
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant specialized in content creation. Provide detailed, creative, and well-structured responses."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      success: true,
      output: response.choices[0].message.content || "No response generated"
    };
  } catch (error) {
    console.error("OpenAI test execution error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during OpenAI execution"
    };
  }
}