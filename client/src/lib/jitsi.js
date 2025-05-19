// Common options for Jitsi Meet
const DEFAULT_DOMAIN = 'meet.jit.si';

/**
 * Initialize a Jitsi Meet API instance
 * @param {string} roomName - The name of the meeting room
 * @param {string} displayName - The user's display name
 * @param {string} avatarUrl - The user's avatar URL (optional)
 * @param {HTMLElement} parentNode - The container element
 * @param {object} options - Additional configuration options
 * @returns {JitsiMeetExternalAPI} The Jitsi Meet API instance
 */
export const initJitsiMeet = (roomName, displayName, avatarUrl, parentNode, options = {}) => {
  // Make sure the Jitsi Meet API script is loaded
  if (!window.JitsiMeetExternalAPI) {
    throw new Error("Jitsi Meet External API not loaded. Make sure to include the script in your HTML.");
  }

  // Ensure room name is URL-friendly
  const safeRoomName = roomName.replace(/[^a-zA-Z0-9-_]/g, '-');

  // Default configuration
  const domain = options.domain || DEFAULT_DOMAIN;
  const width = options.width || '100%';
  const height = options.height || '100%';
  
  // User info
  const userInfo = {
    displayName: displayName
  };
  
  if (avatarUrl) {
    userInfo.avatarURL = avatarUrl;
  }

  // Configure interface
  const interfaceConfig = {
    TOOLBAR_BUTTONS: [
      'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
      'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
      'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
      'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
      'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
      'security', 'invite'
    ],
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    DEFAULT_BACKGROUND: '#3949AB',
    ...options.interfaceConfig
  };

  // Create and return Jitsi Meet External API instance
  const jitsiOptions = {
    roomName: safeRoomName,
    width,
    height,
    parentNode,
    userInfo,
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: false,
      prejoinPageEnabled: true,
      disableDeepLinking: true,
      ...options.configOverwrite
    },
    interfaceConfigOverwrite: interfaceConfig
  };

  return new window.JitsiMeetExternalAPI(domain, jitsiOptions);
};

/**
 * Generate a unique meeting URL for a session
 * @param {string} sessionId - The session ID
 * @returns {string} The Jitsi meeting URL
 */
export const generateMeetingUrl = (sessionId) => {
  const roomName = `skillswap-${sessionId}`;
  return `https://${DEFAULT_DOMAIN}/${roomName}`;
};

/**
 * Load the Jitsi Meet External API script
 * @returns {Promise} A promise that resolves when the script is loaded
 */
export const loadJitsiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};
