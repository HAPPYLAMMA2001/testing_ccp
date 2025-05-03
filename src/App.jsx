import { useState, useEffect, useRef } from 'react';
import { toggleRecording, stopRecording } from './utils/utils';
import "amazon-connect-streams";
import './App.css';

function App() {
    const containerRef = useRef(null);

    // Function to fetch call_id from the endpoint
    const fetchCallId = async () => {
        const agentId = 2; // Hardcoded agent_id
        try {
            const response = await fetch('https://verisync-analysis-backend.onrender.com/make_entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ agent_id: agentId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch call_id: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Call ID:', data.call_id); // Log the call_id for debugging
            return data.call_id;
        } catch (error) {
            console.error('Error fetching call_id:', error);
            return null;
        }
    };

    useEffect(() => {
        const instanceURL = "https://verisync.my.connect.aws/connect/ccp-v2/";

        let ccp;
        if (containerRef.current) {
            ccp = connect.core.initCCP(containerRef.current, {
                ccpUrl: instanceURL,
                loginPopup: true,
                loginPopupAutoClose: true,
                loginOptions: {
                    autoClose: true,
                    height: 600,
                    width: 400,
                    top: 0,
                    left: 0
                },
                region: 'us-west-2',
                softphone: {
                    allowFramedSoftphone: true,
                    disableRingtone: false,
                    disableEchoCancellation: false,
                    allowFramedVideoCall: true,
                    allowFramedScreenSharing: true,
                    allowFramedScreenSharingPopUp: true,
                    VDIPlatform: null,
                    allowEarlyGum: true,
                },
                task: {
                    disableRingtone: false,
                },
                pageOptions: {
                    enableAudioDeviceSettings: false,
                    enableVideoDeviceSettings: false,
                    enablePhoneTypeSettings: true
                }
            });

            // Listen for contact events
            connect.contact(contact => {
                contact.onConnected(async () => {
                    console.log("Call has been established!");

                    // Fetch call_id before starting recording
                    const callId = await fetchCallId();
                    if (callId) {
                        console.log(`Recording started for Call ID: ${callId}`);
                        await toggleRecording(); // Start recording when the call is established
                    } else {
                        console.error('Failed to start recording due to missing call_id');
                    }
                });

                contact.onEnded(() => {
                    console.log("Call has ended!");
                    stopRecording(); // Stop recording when the call ends
                });
            });

            return () => {
                if (ccp) {
                    ccp.cleanup();
                }
            };
        }
    }, []);

    return (
        <div>
            <div ref={containerRef} style={{ width: "400px", height: "600px" }}></div>
        </div>
    );
}

export default App;