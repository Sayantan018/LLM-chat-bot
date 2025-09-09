const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // Serve frontend files

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'deepseek-r1:7b',
            prompt: userMessage,
            stream: false,
        });

        // Format response for better readability
        let botResponse = response.data.response;
        botResponse = botResponse
            .replace(/###\s*(.*?)\n/g, '\n**$1**\n')  // Convert ### headings to bold sections
            .replace(/\*\*(.*?)\*\*/g, '\n**$1**\n')  // Ensure all bold texts are on new lines
            .replace(/- (.*?)(\n|$)/g, '• $1\n')      // Convert dashes to bullet points
            .replace(/\n{2,}/g, '\n');               // Remove extra new lines for better readability

        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error communicating with Ollama:', error.message);
        res.status(500).json({ error: 'Failed to get response from Ollama' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
