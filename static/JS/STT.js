let mediaRecorder;
let audioChunks = [];

const userInput = document.getElementById('user-input');
const recordingStatusDiv = document.getElementById('recordingStatus');

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

async function handleKeyDown(event) {
    if (event.key.toLowerCase() === 'v' && !mediaRecorder && !userInput.contains(document.activeElement)) {
        await startRecording();
    }
}

function handleKeyUp(event) {
    if (event.key.toLowerCase() === 'v' && mediaRecorder && !userInput.contains(document.activeElement)) {
        stopRecording();
    }
}

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = sendAudioToServer;

    mediaRecorder.start(1000); // Collect audio in 1-second chunks
    recordingStatusDiv.textContent = '🟢';
}

function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder = null;
    recordingStatusDiv.textContent = '🔴';
}

async function sendAudioToServer() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    audioChunks = [];

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        userInput.value = data.transcript;
        sendMessage(); // Simulate sending the message
    } catch (error) {
        console.error('Error:', error);
    }
}