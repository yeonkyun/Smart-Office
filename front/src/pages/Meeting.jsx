// 화상 회의 화면
import WebRTCComponent from '../components/webrtc/WebRTCComponents.tsx';
import '../styles/pages.css';

const Meeting = () => {
    const roomId = "default-room";

    return (
        <div className="page meeting-page">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="text-gradient">Video Conference</span>
                </h1>
            </div>
            <div className="meeting-container">
                <WebRTCComponent roomId={roomId} />
            </div>
        </div>
    );
};

export default Meeting;