import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import "amazon-connect-streams";
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const instanceURL = "https://verisync.awsapps.com/connect/ccp-v2/"; // Replace with your Amazon Connect instance URL
    
    if (containerRef.current) {
      connect.core.initCCP(containerRef.current, {
        ccpUrl: instanceURL,            // REQUIRED
        loginPopup: true,               // optional, defaults to `true`
        loginPopupAutoClose: true,      // optional, defaults to `false`
        loginOptions: {                 // optional, if provided opens login in new window
          autoClose: true,              // optional, defaults to `false`
          height: 600,                  // optional, defaults to 578
          width: 400,                   // optional, defaults to 433
          top: 0,                       // optional, defaults to 0
          left: 0                       // optional, defaults to 0
        },
        region: 'us-west-2', // REQUIRED for `CHAT`, optional otherwise
        softphone: {
          allowFramedSoftphone: true,
          disableRingtone: false,
          ringtoneUrl: '[your-ringtone-filepath].mp3',
          disableEchoCancellation: false,
          allowFramedVideoCall: true,
          allowFramedScreenSharing: true,
          allowFramedScreenSharingPopUp: true,
          VDIPlatform: null,
          allowEarlyGum: true,
        },
        task: {
          disableRingtone: false,
          ringtoneUrl: "[your-ringtone-filepath].mp3"
        },
        pageOptions: {
          enableAudioDeviceSettings: false,
          enableVideoDeviceSettings: false,
          enablePhoneTypeSettings: true
        },
        shouldAddNamespaceToLogs: false,
        ccpAckTimeout: 5000,
        ccpSynTimeout: 3000,
        ccpLoadTimeout: 10000
      });
    }
  }, []);

  return (
    <div>
      <div ref={containerRef} style={{ width: "400px", height: "600px" }}></div>
    </div>
  )
}

export default App
