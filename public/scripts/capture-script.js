let mediaRecorder;
let audioChunks = [];
let stream = null;

window.onload = () => {
    // Get buttons and display elements
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const transcribeBtn = document.getElementById('transcribeBtn');
    const transcriptionDisplay = document.getElementById('transcription');

    // Initial setup of buttons
    pauseBtn.disabled = true;
    transcribeBtn.disabled = true;

    // Start/Stop recording
    startBtn.addEventListener('click', async () => {
        if (startBtn.textContent === 'Start') {
            // Start recording
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.start();
            startBtn.textContent = 'Stop'; // Change Start button to Stop
            pauseBtn.disabled = false; // Enable Pause button
            transcribeBtn.disabled = true; // Disable Transcribe button until Stop is pressed
        } else if (startBtn.textContent === 'Stop') {
            // Stop recording
            mediaRecorder.stop();
            startBtn.textContent = 'Start'; // Change Stop button back to Start
            pauseBtn.disabled = true; // Disable Pause button after stopping
            transcribeBtn.disabled = false; // Enable Transcribe button
        }
    });

    // Handle pause and resume functionality
    pauseBtn.addEventListener('click', () => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            pauseBtn.textContent = 'Resume'; // Change Pause button to Resume
        } else if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            pauseBtn.textContent = 'Pause'; // Change Resume button back to Pause
        }
    });

    // Handle transcribe functionality
    transcribeBtn.addEventListener('click', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        // Send audio to the backend for transcription
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            transcriptionDisplay.textContent = `Transcription: ${data.transcription}`;
        })
        .catch(error => {
            console.error('Error uploading file:', error);
        });
        transcribeBtn.disabled = true;
    });
};
