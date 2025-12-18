// src/agents/seoAgent.js
const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { callLLM } = require('../llm');

const SHEET_ID = "1zzf4ax_H2WiTBVrJigGjF2Q3Yz-qy2qMCbAMKvl6VEE";
// We added '&gid=1438203274' to target the specific tab
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1438203274`;

async function fetchSEOData() {
    console.log(` Downloading Sheet...`);
    try {
        const response = await axios.get(CSV_URL);
        // DEBUG: Print first 100 characters to ensure we got CSV, not HTML
        console.log(`Raw Data Preview: ${response.data.substring(0, 100)}...`);
        
        const records = parse(response.data, {
            columns: true,
            skip_empty_lines: true
        });
        console.log(` Parsed ${records.length} rows from Sheet.`);
        return records;
    } catch (error) {
        console.error("Error fetching sheet:", error.message);
        return [];
    }
}

async function runSEOAgent(query, rawMode = false) {
    // 1. Fetch live data
    const allData = await fetchSEOData();

    // 2. Filter Logic (Using LLM to write the filter is risky, so we use a search approach for Tier 2)
    // For safety in Hackathons, we will "Search" the JSON ourselves first.
    
    // Safety Limit: If rawMode (Tier 3), return top 50 rows to avoid token overflow
    if (rawMode) {
        return allData.slice(0, 50); 
    }

    // Tier 2: Summarize
    const summaryData = allData.slice(0, 20); // Send first 20 rows to LLM for context
    
    const summary = await callLLM([
        { role: "system", content: "You are an SEO expert. Answer the user question based strictly on this SEO audit data." },
        { role: "user", content: `Question: ${query}\nData: ${JSON.stringify(summaryData)}` }
    ]);

    return summary;
}

module.exports = { runSEOAgent };