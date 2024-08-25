let audioQueue = [];
let isPlaying = false;
let currentAudio = null;
let apiCallQueue = [];
let isProcessingApiCall = false;

function processAudioChunk(chunk) {
    const blob = new Blob([chunk], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    audioQueue.push(url);
    if (!isPlaying) {
        playNext();
    }
}

function playNext() {
    if (audioQueue.length > 0) {
        isPlaying = true;
        const url = audioQueue.shift();
        currentAudio = new Audio(url);
        currentAudio.onended = () => {
            URL.revokeObjectURL(url);
            playNext();
        };
        currentAudio.play();
    } else {
        isPlaying = false;
        currentAudio = null;
        processNextApiCall();
    }
}

function fetchAndProcessAudio(url, text, shouldClear = false) {
    const apiCall = { url, text, shouldClear };
    apiCallQueue.push(apiCall);
    
    if (!isProcessingApiCall) {
        processNextApiCall();
    }
}

function processNextApiCall() {
    if (apiCallQueue.length === 0) {
        isProcessingApiCall = false;
        return;
    }

    isProcessingApiCall = true;
    const { url, text, shouldClear } = apiCallQueue.shift();

    if (shouldClear) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        audioQueue.forEach(url => URL.revokeObjectURL(url));
        audioQueue = [];
        isPlaying = false;
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.body;
    })
    .then(body => {
        const reader = body.getReader();
        let buffer = new Uint8Array();

        function readChunk() {
            return reader.read().then(({ done, value }) => {
                if (done) {
                    if (buffer.length > 0) {
                        processAudioChunk(buffer);
                    }
                    if (apiCallQueue.length > 0) {
                        processNextApiCall();
                    } else {
                        isProcessingApiCall = false;
                    }
                    return;
                }

                buffer = concatenateArrays(buffer, value);

                while (buffer.length >= 44 && buffer.length >= getWavFileSize(buffer)) {
                    const size = getWavFileSize(buffer);
                    const chunk = buffer.slice(0, size);
                    buffer = buffer.slice(size);
                    processAudioChunk(chunk);
                }

                return readChunk();
            });
        }

        return readChunk();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing the text to speech.');
        isProcessingApiCall = false;
        processNextApiCall();
    });
}

function concatenateArrays(array1, array2) {
    const result = new Uint8Array(array1.length + array2.length);
    result.set(array1, 0);
    result.set(array2, array1.length);
    return result;
}

function getWavFileSize(buffer) {
    return buffer[4] + (buffer[5] << 8) + (buffer[6] << 16) + (buffer[7] << 24) + 8;
}

function convertToSpeech() {
    const text = document.getElementById('textInput').value;
    fetchAndProcessAudio('/tts', text, true);
}
function convertToSpeechwithText(text) {
    fetchAndProcessAudio('/tts', text, true);
}

function appendToSpeech() {
    const text = document.getElementById('textInput').value;
    fetchAndProcessAudio('/ttsappend', text, false);
}
function appendToSpeechwithText(text) {
    fetchAndProcessAudio('/ttsappend', text, false);
}