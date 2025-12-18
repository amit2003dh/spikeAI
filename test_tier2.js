// test_tier2.js
const axios = require('axios');

const payload = {
    // SEO queries don't need a propertyId, but we leave it blank
    query: "Which URLs have title tags longer than 60 characters?"
};

async function runTest() {
    console.log(" Sending SEO query to server...");
    try {
        const response = await axios.post('http://localhost:8080/query', payload);
        console.log(" SUCCESS! Server Response:");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log("ERROR:");
        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
    }
}

runTest();