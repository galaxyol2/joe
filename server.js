// server.js - Fixed version with ChemicalJS static files
import { ChemicalServer } from "chemicaljs";
import express from "express";
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

// Chemical proxy configuration
const chemical = new ChemicalServer({
    default: "uv",
    uv: true,
    scramjet: true
});

// Serve YOUR static files (index.html, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 IMPORTANT: Serve ChemicalJS client scripts from node_modules
const chemicalDist = path.join(__dirname, 'node_modules', 'chemicaljs', 'dist');
app.use('/chemical.js', express.static(path.join(chemicalDist, 'chemical.js')));
app.use('/chemical.components.js', express.static(path.join(chemicalDist, 'chemical.components.js')));

// API endpoint for ChatGPT fallback (optional)
app.get('/api/chat', express.json(), async (req, res) => {
    const { prompt, apiKey } = req.query;
    if (!apiKey) {
        return res.json({ error: 'No API key provided. Get one at platform.openai.com/api-keys' });
    }
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'ChatGPT API error' });
    }
});

// Proxy requests handler
app.use((req, res, next) => {
    // Let Chemical handle proxy requests
    if (req.url.startsWith('/service/') || req.url.includes('bare')) {
        return chemical.handleRequest(req, res);
    }
    next();
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 Your custom proxy is running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`\n✨ Features enabled:`);
    console.log(`   ✅ Ultraviolet proxy engine`);
    console.log(`   ✅ Scramjet fallback engine`);
    console.log(`   ✅ ChemicalJS client scripts served`);
});
