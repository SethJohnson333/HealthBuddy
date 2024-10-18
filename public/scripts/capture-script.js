let mediaRecorder;
let audioChunks = [];
let stream = null;

window.onload = () => {
    // Get buttons and display elements
    const startBtn = document.getElementById('startBtn');
    const startBtnText = startBtn.querySelector('span');
    const pauseBtn = document.getElementById('pauseBtn');
    const pauseBtnText = pauseBtn.querySelector('span');
    const transcribeBtn = document.getElementById('transcribeBtn');
    const transcriptionDisplay = document.getElementById('transcription');

    // Initial setup of buttons
    pauseBtn.disabled = true;
    transcribeBtn.disabled = true;

    // Start/Stop recording and toggle color
    startBtn.addEventListener('click', async () => {
        if (startBtnText.textContent === 'Start') {
            // Start recording
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.start();
            startBtnText.textContent = 'Stop'; // Change button text to Stop
            startBtn.classList.add('recording'); // Add 'recording' class to toggle color
            pauseBtn.disabled = false; // Enable Pause button
            transcribeBtn.disabled = true; // Disable Transcribe button until Stop is pressed
        } else if (startBtnText.textContent === 'Stop') {
            // Stop recording
            mediaRecorder.stop();
            startBtnText.textContent = 'Start'; // Change button text back to Start
            startBtn.classList.remove('recording'); // Remove 'recording' class
            pauseBtn.disabled = true; // Disable Pause button after stopping
            transcribeBtn.disabled = false; // Enable Transcribe button
        }
    });

    // Handle pause and resume functionality
    pauseBtn.addEventListener('click', () => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            pauseBtnText.textContent = 'Resume'; // Change Pause button text to Resume
        } else if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            pauseBtnText.textContent = 'Pause'; // Change Resume button text back to Pause
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
