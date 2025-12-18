// src/agents/ga4Agent.js
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { callLLM } = require('../llm');
const path = require('path');

// Initialize client with credentials.json at ROOT
const analyticsDataClient = new BetaAnalyticsDataClient({
    keyFilename: path.join(__dirname, '../../credentials.json')
});

async function runAnalyticsAgent(query, propertyId, rawMode = false) {
    // 1. Convert NL to GA4 Query Object
    const systemPrompt = `
    You are a GA4 Expert. Convert the user query into a JSON object for the runReport API.
    Available Metrics: activeUsers, sessions, screenPageViews.
    Available Dimensions: date, pagePath, country.
    
    Return ONLY JSON matching this structure:
    {
        "dateRanges": [{ "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }],
        "dimensions": [{ "name": "..." }],
        "metrics": [{ "name": "..." }],
        "limit": 10
    }
    Use "today", "yesterday", or "30daysAgo" for dates if specific dates aren't given.
    `;

    const apiPlanRaw = await callLLM([
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
    ], true);

    const apiPlan = JSON.parse(apiPlanRaw);
    
    // 2. Call GA4 API
    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            ...apiPlan
        });

        // 3. Parse Data
        const rows = response.rows.map(row => {
            let item = {};
            response.dimensionHeaders.forEach((h, i) => item[h.name] = row.dimensionValues[i].value);
            response.metricHeaders.forEach((h, i) => item[h.name] = row.metricValues[i].value);
            return item;
        });

        if (rawMode) return rows;

        // 4. Summarize for User
        const summary = await callLLM([
            { role: "system", content: "Summarize this data payload to answer the user's question clearly." },
            { role: "user", content: `Question: ${query}\nData: ${JSON.stringify(rows)}` }
        ]);

        return summary;

    } catch (e) {
        console.error("GA4 API Failed", e);
        return "I encountered an error querying Google Analytics.";
    }
}

module.exports = { runAnalyticsAgent };