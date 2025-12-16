import * as THREE from 'three';

export enum AppState {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  PHOTO_ZOOM = 'PHOTO_ZOOM',
}

export interface ParticleData {
  id: number;
  initialPos: THREE.Vector3;
  targetPos: THREE.Vector3; // Tree position
  scatterPos: THREE.Vector3; // Random float position
  velocity: THREE.Vector3;
  meshIndex: number;
  type: 'sphere' | 'cube' | 'cane';
}

export interface PhotoData {
  id: string;
  texture: THREE.Texture;
  aspectRatio: number;
  position: THREE.Vector3; // Current visual position
  treePos: THREE.Vector3;
  scatterPos: THREE.Vector3;
  rotation: THREE.Euler;
}

export interface HandGesture {
  isFist: boolean;
  isOpen: boolean;
  isPinching: boolean;
  palmPosition: { x: number; y: number };
}

// MediaPipe Global Types (since we load via CDN)
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}