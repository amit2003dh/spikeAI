// src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const { orchestrate } = require('./orchestrator');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

app.post('/query', async (req, res) => {
    try {
        const { query, propertyId } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        console.log(`Received Query: ${query}`);
        
        // Pass to Orchestrator
        const response = await orchestrate(query, propertyId);
        
        // Return JSON response (which might contain a text answer inside)
        res.json(response);
        
    } catch (error) {
        console.error("Error processing query:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});