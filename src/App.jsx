import { useState, useEffect, useRef } from 'react';

import "amazon-connect-streams";
import './App.css';

function App() {
    const containerRef = useRef(null);

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
                    ringtoneUrl: '/path/to/your/ringtone.mp3', // Update this path
                    disableEchoCancellation: false,
                    allowFramedVideoCall: true,
                    allowFramedScreenSharing: true,
                    allowFramedScreenSharingPopUp: true,
                    VDIPlatform: null,
                    allowEarlyGum: true,
                },
                task: {
                    disableRingtone: false,
                    ringtoneUrl: "/path/to/your/ringtone.mp3"
                },
                pageOptions: {
                    enableAudioDeviceSettings: false,
                    enableVideoDeviceSettings: false,
                    enablePhoneTypeSettings: true
                }
            });

            // Listen for contact events
            connect.contact(contact => {
                contact.onConnected(() => {
                    handleCallEstablished();
                });
            });

            return () => {
                if (ccp) {
                    ccp.cleanup();
                }
            };
        }
    }, []);

    // Dummy function to handle call establishment
    const handleCallEstablished = () => {
        console.log("Call has been established!");
        // Add your custom logic here
    };

    return (
        <div>
            <div ref={containerRef} style={{ width: "400px", height: "600px" }}></div>
        </div>
    );
}

export default App;