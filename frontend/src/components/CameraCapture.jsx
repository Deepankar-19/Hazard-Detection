import { useRef, useState, useEffect } from 'react';
import { Camera, ExternalLink } from 'lucide-react';

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied or unavailable. Please enable camera access.');
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'hazard-capture.jpg', { type: 'image/jpeg' });
          onCapture(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center border border-red-100">
        <p className="font-medium text-sm mb-2">{error}</p>
        <button 
          onClick={startCamera}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 active:scale-95 transition-all"
        >
          Retry Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-black shadow-inner">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute bottom-4 left-0 right-0 flex justify-center pb-2">
        <button
          onClick={captureFrame}
          className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center p-1 border-4 border-white backdrop-blur-md hover:bg-white/40 active:scale-95 transition-all"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Camera size={24} className="text-gray-900" />
          </div>
        </button>
      </div>
    </div>
  );
}
