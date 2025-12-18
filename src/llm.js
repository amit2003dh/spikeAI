// src/llm.js
const OpenAI = require('openai');
require('dotenv').config(); // Ensure you have dotenv installed

// HARDCODE API KEY FOR HACKATHON or use ENV
// Note: In production/submission, use process.env, but for the hackathon script 
// they might inject it differently. Best to use ENV variable.
const apiKey = process.env.LITELLM_API_KEY || "sk-Njm7bQTeLrhVOuZd9eagew"; 

const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "http://3.110.18.218" 
});

async function callLLM(messages, jsonMode = false) {
    try {
        const response = await client.chat.completions.create({
            model: "gemini-2.5-pro", // Fast and cheap for routing
            messages: messages,
            response_format: jsonMode ? { type: "json_object" } : { type: "text" }
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("LLM Error:", error);
        throw error;
    }
}

module.exports = { callLLM };