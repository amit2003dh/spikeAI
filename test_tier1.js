// test_tier1.js
const axios = require('axios');

const payload = {
    // Replace with your actual Property ID if different
    propertyId: "516779548", 
    query: "How many active users did we have yesterday?"
};

async function runTest() {
    console.log("⏳ Sending query to server...");
    try {
        const response = await axios.post('http://localhost:8080/query', payload);
        console.log("✅ SUCCESS! Server Response:");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log("❌ ERROR:");
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
    }
}

runTest();