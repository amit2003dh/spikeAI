// src/agents/seoAgent.js
const axios = require('axios');
const { parse } = require('csv-parse/sync'); // Synchronous parsing for simplicity
const { callLLM } = require('../llm');

const SHEET_ID = "1zzf4ax_H2WiTBVrJigGjF2Q3Yz-qy2qMCbAMKvl6VEE"; // From problem statement
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

async function fetchSEOData() {
    const response = await axios.get(CSV_URL);
    const records = parse(response.data, {
        columns: true,
        skip_empty_lines: true
    });
    return records; // Returns array of objects
}

async function runSEOAgent(query, rawMode = false) {
    // 1. Fetch live data
    const allData = await fetchSEOData();

    // 2. Ask LLM to write a JavaScript filter function
    // (This is safer than passing all data to LLM context window which might be too large)
    const systemPrompt = `
    You have a dataset with columns: Address, Status Code, Title 1, Indexability, Meta Description 1.
    Write a Javascript filter function body to answer the user query.
    The variable 'data' is the array of rows. 
    Return JSON: { "code": "data.filter(row => ...)" }
    `;

    const codePlanRaw = await callLLM([
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
    ], true);

    const codePlan = JSON.parse(codePlanRaw);

    // 3. Execute logic safely
    // Note: eval() is dangerous in prod, but standard for hackathons if inputs are sanitized.
    // For a safer bet, we can ask the LLM to just extract keywords and filter manually,
    // but code generation is more powerful.
    
    let filteredData;
    try {
        // Create a function from the string
        const filterFunc = new Function('data', `return ${codePlan.code}`);
        filteredData = filterFunc(allData);
    } catch (e) {
        // Fallback: Just search text
        filteredData = allData.slice(0, 10); // dummy fallback
    }

    if (rawMode) return filteredData;

    // 4. Summarize
    // Limit context size to prevent token overflow
    const summaryData = filteredData.slice(0, 20); 

    const summary = await callLLM([
        { role: "system", content: "Answer the user question based on this SEO audit data." },
        { role: "user", content: `Question: ${query}\nData: ${JSON.stringify(summaryData)}` }
    ]);

    return summary;
}

module.exports = { runSEOAgent };