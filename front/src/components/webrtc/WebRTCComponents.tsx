// WebRTCComponent.tsx
import React, { useEffect, useRef, useState } from 'react';
import { checkWebRTCSupport } from '../../utils/webrtc.ts';
import '../../styles/webrtc.css';

interface WebRTCComponentProps {
  roomId: string;
}

const WebRTCComponent: React.FC<WebRTCComponentProps> = ({ roomId }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const websocket = useRef<WebSocket | null>(null);

  const configuration: RTCConfiguration = {
    iceServers: [
      {
        urls: 'turn:210.119.34.236:3478',
        username: 'turnuser',
        credential: 'Turn2024!@#'
      }
    ]
  };

  const sendSignalingMessage = (message: any) => {
    if (websocket.current?.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message.type);
      websocket.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open');
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnection.current) {
        console.log('Setting remote description (offer)');
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        
        console.log('Creating answer');
        const answer = await peerConnection.current.createAnswer();
        
        console.log('Setting local description (answer)');
        await peerConnection.current.setLocalDescription(answer);
        
        sendSignalingMessage({
          type: 'answer',
          data: answer,
          roomId
        });
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnection.current) {
        console.log('Setting remote description (answer)');
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnection.current) {
        console.log('Adding ICE candidate');
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const startCall = async () => {
    try {
      if (peerConnection.current) {
        console.log('Creating offer');
        const offer = await peerConnection.current.createOffer();
        
        console.log('Setting local description (offer)');
        await peerConnection.current.setLocalDescription(offer);
        
        sendSignalingMessage({
          type: 'offer',
          data: offer,
          roomId
        });
        
        setIsCallStarted(true);
      }
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const endCall = () => {
    try {
      localStream?.getTracks().forEach(track => track.stop());
      peerConnection.current?.close();
      setIsCallStarted(false);
      setIsConnected(false);
      setRemoteStream(null);
      console.log('Call ended');
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Checking WebRTC support...');
        const support = checkWebRTCSupport();
        
        if (!support.webRTC || !support.getUserMedia) {
          throw new Error('Your browser does not support required WebRTC features');
        }

        console.log('Initializing WebRTC...');
        
        websocket.current = new WebSocket('ws://210.119.34.236:80/signal');
        
        websocket.current.onopen = () => {
          console.log('WebSocket connected');
          sendSignalingMessage({
            type: 'join',
            roomId
          });
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: true
          });
          console.log('Local media stream obtained');
        } catch (mediaError) {
          console.error('Media access error:', mediaError);
          throw new Error('Unable to access camera and microphone');
        }

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnection.current = new RTCPeerConnection(configuration);
        console.log('PeerConnection created with config:', configuration);

        stream.getTracks().forEach(track => {
          if (peerConnection.current) {
            console.log('Adding track to peer connection:', track.kind);
            peerConnection.current.addTrack(track, stream);
          }
        });

        peerConnection.current.ontrack = (event) => {
          console.log('Received remote track:', event.track.kind);
          if (remoteVideoRef.current && event.streams[0]) {
            console.log('Setting remote stream');
            remoteVideoRef.current.srcObject = event.streams[0];
            setRemoteStream(event.streams[0]);
          }
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('Sending ICE candidate');
            sendSignalingMessage({
              type: 'ice-candidate',
              data: event.candidate,
              roomId
            });
          }
        };

        peerConnection.current.onconnectionstatechange = () => {
          console.log('Connection state changed:', peerConnection.current?.connectionState);
          setIsConnected(peerConnection.current?.connectionState === 'connected');
        };

        websocket.current.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message.type);

            switch (message.type) {
              case 'offer':
                await handleOffer(message.data);
                break;
              case 'answer':
                await handleAnswer(message.data);
                break;
              case 'ice-candidate':
                await handleIceCandidate(message.data);
                break;
              default:
                console.log('Unknown message type:', message.type);
            }
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        };

        websocket.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        };

        websocket.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setInitError('WebSocket connection failed');
        };

      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        setInitError(error.message);
      }
    };

    init();

    return () => {
      console.log('Cleaning up...');
      localStream?.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      if (peerConnection.current) {
        console.log('Closing peer connection');
        peerConnection.current.close();
      }
      if (websocket.current) {
        console.log('Closing WebSocket');
        websocket.current.close();
      }
    };
  }, [roomId]);

  if (initError) {
    return (
      <div className="webrtc-error">
        <h2>WebRTC Error</h2>
        <p>{initError}</p>
        <p>Please use a modern browser with camera and microphone support.</p>
        <p>Supported browsers:</p>
        <ul>
          <li>Google Chrome (recommended)</li>
          <li>Mozilla Firefox</li>
          <li>Microsoft Edge</li>
          <li>Safari 11+</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="webrtc-container">
      <div className="video-grid">
        <div className="video-wrapper">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="video-stream"
          />
          <div className="video-label">Local Stream</div>
        </div>
        <div className="video-wrapper">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="video-stream"
          />
          <div className="video-label">Remote Stream</div>
        </div>
      </div>
      <div className="controls">
        {!isCallStarted ? (
          <button 
            onClick={startCall}
            className="control-button start-call"
            disabled={!localStream}
          >
            Start Call
          </button>
        ) : (
          <button 
            onClick={endCall}
            className="control-button end-call"
          >
            End Call
          </button>
        )}
      </div>
      <div className="connection-status">
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

export default WebRTCComponent;