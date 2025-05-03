let isRecording = false;
let micRecorder = null;
let speakerRecorder = null;
let micStream = null;
let speakerStream = null;
let currentSegment = 1;
let isProcessingTranscription = false;

async function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    try {
        const selectedDeviceId = "70b4b4a8af37d5ff9564efcc34ef04794683a14eb3328f6836d66abeabdf4e7e";

        currentSegment = 1;

        micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        speakerStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { exact: selectedDeviceId },
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        isRecording = true;
        startNewSegment();
    } catch (error) {
        console.error("Error starting recording:", error);
        alert(`Error starting recording: ${error.message}`);
    }
}

async function startNewSegment() {
    if (!isRecording) return;

    try {
        const micChunks = [];
        const speakerChunks = [];

        micRecorder = new MediaRecorder(micStream);
        speakerRecorder = new MediaRecorder(speakerStream);

        micRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                micChunks.push(event.data);
            }
        };

        speakerRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                speakerChunks.push(event.data);
            }
        };

        micRecorder.start();
        speakerRecorder.start();

        // Stop recording after 10 seconds
        setTimeout(async () => {
            micRecorder.stop();
            speakerRecorder.stop();

            const micAudioBlob = new Blob(micChunks, { type: 'audio/webm' });
            const speakerAudioBlob = new Blob(speakerChunks, { type: 'audio/webm' });

            // Send both audio blobs to the transcription endpoint
            const result = await sendAudioForTranscription(micAudioBlob, speakerAudioBlob, currentSegment);
            if (result) {
                console.log(`Transcription for Segment ${currentSegment} completed.`);
            }

            currentSegment++;
            if (isRecording) {
                startNewSegment(); // Start the next segment
            }
        }, 30000);
    } catch (error) {
        console.error("Error in startNewSegment:", error);
    }
}

async function processTranscription(micAudioBlob, speakerAudioBlob, segmentNumber) {
    while (isProcessingTranscription) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
        isProcessingTranscription = true;
        const transcription = await sendAudioForTranscription(micAudioBlob, speakerAudioBlob, segmentNumber);
        if (transcription) {
            console.log(`Combined Transcription (Segment ${segmentNumber}):`, transcription.combined_transcription);
            console.log(`Microphone Transcription (Segment ${segmentNumber}):`, transcription.agent_transcription);
            console.log(`Speaker Transcription (Segment ${segmentNumber}):`, transcription.client_transcription);
        }
    } catch (error) {
        console.error(`Error processing transcription for segment ${segmentNumber}:`, error);
    } finally {
        isProcessingTranscription = false;
    }
}

async function sendAudioForTranscription(micAudioBlob, speakerAudioBlob, segmentNumber) {
    try {
        const formData = new FormData();
        formData.append('agent_audio', micAudioBlob, `microphone-segment-${segmentNumber}.webm`);
        formData.append('client_audio', speakerAudioBlob, `speaker-segment-${segmentNumber}.webm`);

        const response = await fetch('https://verisync-analysis-backend.onrender.com/stt', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Combined Transcription:', result.combined_transcription);
        console.log('Microphone Transcription:', result.agent_transcription);
        console.log('Speaker Transcription:', result.client_transcription);

        return result;
    } catch (error) {
        console.error(`Error in transcription API call for segment ${segmentNumber}:`, error);
        return null;
    }
}

function stopRecording() {
    isRecording = false;
    
    if (micRecorder && micRecorder.state === "recording") {
        micRecorder.stop();
    }
    if (speakerRecorder && speakerRecorder.state === "recording") {
        speakerRecorder.stop();
    }

    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
    }
    if (speakerStream) {
        speakerStream.getTracks().forEach(track => track.stop());
    }

    micRecorder = null;
    speakerRecorder = null;
    micStream = null;
    speakerStream = null;
    currentSegment = 1;
    isProcessingTranscription = false;
}

async function startMicCapture() {
    try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordAudio(micStream, "micAudio", "micDownload");
    } catch (error) {
        console.error("Error capturing microphone audio:", error);
        alert("Error capturing microphone audio. Check console for details.");
    }
}

async function startSpeakerCapture() {
    try {
        const selectElement = document.getElementById('audioInputSelect');
        if (!selectElement) {
            alert("Please list available devices first.");
            return;
        }

        const selectedDeviceId = selectElement.value;
        if (!selectedDeviceId) {
            alert("Please select an audio input device first.");
            return;
        }

        try {
            const speakerStream = await navigator.mediaDevices.getUserMedia({
                audio: { 
                    deviceId: { exact: selectedDeviceId },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            recordAudio(speakerStream, "speakerAudio", "speakerDownload");
        } catch (constraintError) {
            console.log("Trying with preferred deviceId instead of exact...");
            const speakerStream = await navigator.mediaDevices.getUserMedia({
                audio: { 
                    deviceId: { preferred: selectedDeviceId },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            recordAudio(speakerStream, "speakerAudio", "speakerDownload");
        }
    } catch (error) {
        console.error("Error capturing speaker audio:", error);
        alert(`Error capturing speaker audio: ${error.message}\nPlease make sure you've selected a valid audio input device and granted necessary permissions.`);
    }
}

async function startSimultaneousCapture() {
    try {
        const micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        const selectElement = document.getElementById('audioInputSelect');
        if (!selectElement) {
            alert("Please list available devices first.");
            return;
        }

        const selectedDeviceId = selectElement.value;
        if (!selectedDeviceId) {
            alert("Please select a speaker input device (VB-Cable) first.");
            return;
        }

        const speakerStream = await navigator.mediaDevices.getUserMedia({
            audio: { 
                deviceId: { exact: selectedDeviceId },
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        recordAudio(micStream, "micAudio", "micDownload");
        recordAudio(speakerStream, "speakerAudio", "speakerDownload");

    } catch (error) {
        console.error("Error capturing audio:", error);
        alert(`Error capturing audio: ${error.message}\nPlease make sure you've selected valid devices and granted necessary permissions.`);
    }
}

function recordAudio(stream, audioElementId, downloadLinkId) {
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = event => chunks.push(event.data);

    recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);

        const audioElement = document.getElementById(audioElementId);
        audioElement.src = audioUrl;

        const downloadLink = document.getElementById(downloadLinkId);
        downloadLink.href = audioUrl;
        downloadLink.style.display = "block";
    };

    recorder.start();
    setTimeout(() => {
        recorder.stop();
        stream.getTracks().forEach(track => track.stop());
    }, 30000);
}

export { toggleRecording, stopRecording, sendAudioForTranscription };
