import React, { useEffect, useRef } from 'react';
import { HandGesture } from '../types';

interface GestureControllerProps {
  onGestureUpdate: (gesture: HandGesture) => void;
}

const GestureController: React.FC<GestureControllerProps> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');
    
    const onResults = (results: any) => {
      // Update canvas dimensions to match video frame
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      if (canvasCtx) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        if (results.multiHandLandmarks) {
          for (const landmarks of results.multiHandLandmarks) {
            // Draw Connectors (Bones) - Thicker and Brighter
            if (window.drawConnectors && window.HAND_CONNECTIONS) {
                window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {
                    color: '#00FF00', // Bright Green for high visibility
                    lineWidth: 4
                });
            }
            
            // Draw Landmarks (Joints) - Red
            if (window.drawLandmarks) {
                window.drawLandmarks(canvasCtx, landmarks, {
                    color: '#FF0000', 
                    lineWidth: 2, 
                    radius: 5
                });
            }
          }
        }
        canvasCtx.restore();
      }

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // 1. Detect Palm Position (Normalized 0-1)
        const palmX = landmarks[9].x;
        const palmY = landmarks[9].y;

        // 2. Detect Gestures
        const dist = (i1: number, i2: number) => {
          const x = landmarks[i1].x - landmarks[i2].x;
          const y = landmarks[i1].y - landmarks[i2].y;
          const z = landmarks[i1].z - landmarks[i2].z;
          return Math.sqrt(x*x + y*y + z*z);
        };

        // Pinch: Thumb Tip (4) vs Index Tip (8)
        const pinchDist = dist(4, 8);
        const isPinching = pinchDist < 0.05;

        // Fist vs Open
        const tips = [8, 12, 16, 20];
        const avgTipDist = tips.reduce((acc, i) => acc + dist(0, i), 0) / 4;
        
        const isFist = avgTipDist < 0.25; 
        const isOpen = avgTipDist > 0.4 && !isPinching;

        onGestureUpdate({
          isFist,
          isOpen,
          isPinching,
          palmPosition: { x: palmX, y: palmY }
        });

      } else {
        // No hands detected
        onGestureUpdate({
          isFist: false,
          isOpen: false,
          isPinching: false,
          palmPosition: { x: 0.5, y: 0.5 }
        });
      }
    };

    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    const camera = new window.Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    camera.start();

    return () => {
      if (camera.stop) camera.stop(); 
      if (hands.close) hands.close();
    };
  }, [onGestureUpdate]);

  return (
    <div className="relative w-full h-full">
      {/* Video Feed */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-80"
        playsInline
        muted
        autoPlay
      />
      {/* Skeleton Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
      />
      <div className="absolute bottom-1 left-2 text-[10px] text-green-400 font-mono drop-shadow-md">
        Camera Active
      </div>
    </div>
  );
};

export default GestureController;