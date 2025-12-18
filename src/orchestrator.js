// src/orchestrator.js
const { callLLM } = require('./llm');
const { runAnalyticsAgent } = require('./agents/ga4Agent');
const { runSEOAgent } = require('./agents/seoAgent');

async function orchestrate(userQuery, propertyId) {
    console.log(`Orchestrator processing: "${userQuery}"`);

    // 1. Detect Intent
    const systemPrompt = `
    You are a Master Orchestrator. Classify the user intent.
    - "analytics": Questions about traffic, users, sessions, pageviews, dates.
    - "seo": Questions about title tags, meta descriptions, status codes, https, indexability.
    - "both": Questions asking to combine traffic/views with SEO metadata (e.g. "top pages by views and their titles").

    Output strict JSON: { "intent": "analytics" | "seo" | "both" }
    `;

    const intentRaw = await callLLM([
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
    ], true);

    const intentData = JSON.parse(intentRaw);
    console.log(`Intent Detected: ${intentData.intent}`);

    let result;

    try {
        // 2. Route Request
        if (intentData.intent === "analytics") {
            if (!propertyId) return { error: "Property ID required for analytics queries" };
            result = await runAnalyticsAgent(userQuery, propertyId);
        } 
        else if (intentData.intent === "seo") {
            result = await runSEOAgent(userQuery);
        } 
        else if (intentData.intent === "both") {
            console.log("⚡ Executing Multi-Agent Fusion...");
            
            // Run both agents in parallel to save time
            // We pass 'true' to get RAW JSON data, not text summaries
            const [ga4Data, seoData] = await Promise.all([
                runAnalyticsAgent(userQuery, propertyId, true),
                runSEOAgent(userQuery, true)
            ]);

            // Limit data size to avoid token limits (Safety)
            const safeGA4 = Array.isArray(ga4Data) ? ga4Data.slice(0, 10) : ga4Data;
            const safeSEO = Array.isArray(seoData) ? seoData.slice(0, 50) : seoData;

            // 3. Fusion by LLM
            console.log("Merging data...");
            result = await callLLM([
                { role: "system", content: "You are a Data Analyst. Combine the provided Google Analytics data and SEO Audit data to answer the user's request. Match page paths (e.g., /home) with full URLs if necessary." },
                { role: "user", content: `User Query: ${userQuery}\n\nGA4 Data:\n${JSON.stringify(safeGA4)}\n\nSEO Audit Data:\n${JSON.stringify(safeSEO)}` }
            ]);
        }
        else {
            result = "I am not sure how to route this query.";
        }

        // 3. Final Formatting
        // If the result is already a string (summary), return it. 
        // If it's an object, stringify it.
        return { answer: typeof result === 'string' ? result : JSON.stringify(result) };

    } catch (error) {
        console.error("Orchestration Error:", error);
        return { error: "Failed to process query." };
    }
}

module.exports = { orchestrate };