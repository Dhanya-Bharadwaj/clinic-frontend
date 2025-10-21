import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/VideoCall.css';

const VideoCall = ({ bookingId, patientName, doctorName, onClose }) => {
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  useEffect(() => {
    // Load Jitsi Meet API script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => initializeJitsi();
    document.body.appendChild(script);

    return () => {
      // Cleanup Jitsi instance
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
      // Remove script
      const existingScript = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const initializeJitsi = () => {
    if (!window.JitsiMeetExternalAPI) {
      console.error('Jitsi Meet API not loaded');
      return;
    }

    // Create unique room name based on booking ID
    const roomName = `DrMadhusudhan-${bookingId}`;

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: true,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'chat',
          'raisehand',
          'videoquality',
          'filmstrip',
          'tileview',
          'videobackgroundblur',
          'download',
          'help',
          'mute-everyone',
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
      },
      userInfo: {
        displayName: doctorName || patientName || 'User',
      },
    };

    jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);

    // Event listeners
    jitsiApiRef.current.addListener('videoConferenceLeft', () => {
      if (onClose) onClose();
    });

    jitsiApiRef.current.addListener('readyToClose', () => {
      if (onClose) onClose();
    });
  };

  return (
    <div className="video-call-modal">
      <div className="video-call-header">
        <h3>Video Consultation - {patientName || 'Patient'}</h3>
        <button className="close-video-btn" onClick={onClose} type="button">
          End Call
        </button>
      </div>
      <div className="jitsi-container" ref={jitsiContainerRef}></div>
    </div>
  );
};

VideoCall.propTypes = {
  bookingId: PropTypes.string.isRequired,
  patientName: PropTypes.string,
  doctorName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default VideoCall;
