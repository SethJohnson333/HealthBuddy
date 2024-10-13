const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');  // Import the 'form-data' package
const path = require('path');

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({extendes: false}));

app.set('view engine', 'ejs');
app.use(express.static("public"));

// Serve the HTML file from the 'views' directory
app.get('/', (req, res) => {
    res.render("capture");
});

// Define storage for the uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'recording.wav');  // Save the file as recording.wav
  }
});

// Initialize multer with the defined storage
const upload = multer({ storage: storage });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// Handle POST request to upload and transcribe audio
app.post('/upload', upload.single('audio'), async (req, res) => {
  const audioPath = req.file.path;

  try {
    // Call OpenAI's Whisper API for transcription
    const response = await transcribeAudioWithWhisper(audioPath);

    // Delete the audio file after transcription
    fs.unlinkSync(audioPath);

    // Return the transcription result to the frontend
    res.json({ transcription: response });
  } catch (error) {
    console.error('Error during transcription:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Function to transcribe audio using OpenAI Whisper API
async function transcribeAudioWithWhisper(audioPath) {
    const apiKey = process.env.OPENAI_API_KEY;
    const url = 'https://api.openai.com/v1/audio/transcriptions';

    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model', 'whisper-1');

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders(),
    };

    try {
        const response = await axios.post(url, formData, { headers });
        return response.data.text;
    } catch (error) {
        console.error('Error calling Whisper API:', error.response ? error.response.data : error.message);
        throw new Error('Error transcribing audio');
    }
    }
  
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
