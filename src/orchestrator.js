// src/orchestrator.js
const { callLLM } = require('./llm');
const { runAnalyticsAgent } = require('./agents/ga4Agent');
const { runSEOAgent } = require('./agents/seoAgent');

async function orchestrate(userQuery, propertyId) {
    // 1. Detect Intent
    const systemPrompt = `
    You are a classifier. Determine if the user question requires:
    1. "analytics" (Google Analytics data like pageviews, sessions, users)
    2. "seo" (Screaming Frog data like title tags, indexability, meta descriptions)
    3. "both" (Requires joining data from both)

    Output JSON: { "intent": "analytics" | "seo" | "both" }
    `;

    const intentRaw = await callLLM([
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
    ], true);

    const intentData = JSON.parse(intentRaw);
    console.log("Detected Intent:", intentData.intent);

    let result;

    // 2. Route Request
    if (intentData.intent === "analytics") {
        if (!propertyId) throw new Error("Property ID required for analytics queries");
        result = await runAnalyticsAgent(userQuery, propertyId);
    } 
    else if (intentData.intent === "seo") {
        result = await runSEOAgent(userQuery);
    } 
    else {
        // Multi-agent (Advanced - Implement Tier 1 & 2 first!)
        // Basic fusion logic:
        const seoData = await runSEOAgent(userQuery, true); // Return raw data
        const ga4Data = await runAnalyticsAgent(userQuery, propertyId, true); // Return raw data
        
        // Ask LLM to fuse them
        result = await callLLM([
            { role: "system", content: "Combine the following SEO and Analytics data to answer the user request." },
            { role: "user", content: `Query: ${userQuery}\nSEO Data: ${JSON.stringify(seoData)}\nGA4 Data: ${JSON.stringify(ga4Data)}` }
        ]);
    }

    // 3. Final formatting
    // If result is an object (raw data), wrap it or ask LLM to summarize
    if (typeof result === 'object') {
        return { answer: JSON.stringify(result) }; 
    }
    return { answer: result };
}

module.exports = { orchestrate };