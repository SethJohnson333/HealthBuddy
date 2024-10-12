const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files (HTML)
app.use(express.static('public'));

// Simulate transcription (dummy route)
app.post('/transcribe', upload.single('audio'), (req, res) => {
    // Simulate the transecription process (use actual APIs like Whisper or Google STT later)
    console.log('Audio received:', req.file);
    const dummyTranscript = `Speaker 1: Hello, how can I assist you today?\nSpeaker 2: I'm here for my health check-up.`;
    
    res.json({ transcript: dummyTranscript });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
