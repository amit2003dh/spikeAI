// test_tier3.js
const axios = require('axios');

const payload = {
    // Replace with your GA4 Property ID
    propertyId: "516779548", 
    query: "What are the top 5 pages by views and what are their title tags?"
};

async function runTest() {
    console.log("⏳ Sending MULTI-AGENT query to server...");
    try {
        const response = await axios.post('http://localhost:8080/query', payload);
        console.log("✅ SUCCESS! Server Response:");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log("❌ ERROR:");
        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
    }
}

runTest();