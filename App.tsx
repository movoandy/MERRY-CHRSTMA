import React, { useState, useEffect, useCallback } from 'react';
import SceneContainer from './components/SceneContainer';
import UIOverlay from './components/UIOverlay';
import GestureController from './components/GestureController';
import { AppState, HandGesture } from './types';
import * as THREE from 'three';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [photos, setPhotos] = useState<THREE.Texture[]>([]);
  const [gesture, setGesture] = useState<HandGesture>({
    isFist: false,
    isOpen: false,
    isPinching: false,
    palmPosition: { x: 0.5, y: 0.5 },
  });
  
  // Debounce state switching to avoid flickering
  useEffect(() => {
    // 1. Fist always returns to TREE (Safety/Reset)
    if (gesture.isFist && appState !== AppState.TREE) {
      setAppState(AppState.TREE);
    } 
    // 2. Open Hand switches to SCATTER
    // But ONLY if we are in TREE. 
    // If we are in ZOOM, we require a specific action (like clicking background or fist) to exit,
    // otherwise the "default" open hand would instantly kick us out of zoom.
    else if (gesture.isOpen && appState === AppState.TREE) {
      setAppState(AppState.SCATTER);
    } 
    // 3. Pinching triggers ZOOM from SCATTER
    else if (gesture.isPinching && appState === AppState.SCATTER) {
      setAppState(AppState.PHOTO_ZOOM);
    }
  }, [gesture, appState]);

  const handlePhotoUpload = useCallback((files: FileList) => {
    const newTextures: THREE.Texture[] = [];
    const loader = new THREE.TextureLoader();

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      loader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        newTextures.push(tex);
        if (newTextures.length === files.length) {
           // Append new photos
           setPhotos(prev => [...prev, ...newTextures]);
        }
      });
    });
  }, []);

  const handlePhotoSelect = useCallback(() => {
    if (appState !== AppState.PHOTO_ZOOM) {
      setAppState(AppState.PHOTO_ZOOM);
    }
  }, [appState]);

  const handleBackgroundClick = useCallback(() => {
    if (appState === AppState.PHOTO_ZOOM) {
      setAppState(AppState.SCATTER);
    }
  }, [appState]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <SceneContainer 
          appState={appState} 
          photos={photos} 
          gesture={gesture}
          onPhotoSelect={handlePhotoSelect}
          onBackgroundClick={handleBackgroundClick}
        />
      </div>

      {/* Gesture Input Processing (Camera Feed) */}
      <div className="absolute top-4 right-4 z-50 w-48 h-36 border-2 border-yellow-600/50 rounded-lg overflow-hidden bg-black/80 backdrop-blur-md shadow-[0_0_20px_rgba(234,179,8,0.3)]">
        <GestureController onGestureUpdate={setGesture} />
      </div>

      {/* UI Overlay */}
      <UIOverlay 
        appState={appState} 
        onUpload={handlePhotoUpload} 
        photoCount={photos.length}
      />
    </div>
  );
};

export default App;