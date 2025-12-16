import React from 'react';
import { AppState } from '../types';

interface UIOverlayProps {
  appState: AppState;
  onUpload: (files: FileList) => void;
  photoCount: number;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ appState, onUpload, photoCount }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Header */}
      <header className="flex flex-col items-start gap-4">
        <div>
          <h1 className="text-5xl font-serif italic text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
            Merry Christmas
          </h1>
          <p className="text-stone-300 font-light tracking-widest text-sm mt-2 opacity-80 uppercase">
            A Gesture-Controlled Experience
          </p>
        </div>
        
        {/* State Indicator - Moved to left column to avoid Camera overlap */}
        <div className="bg-black/40 backdrop-blur-md border border-stone-700 rounded-full px-6 py-2 inline-flex items-center">
          <span className="text-xs tracking-widest text-stone-400 mr-2">STATE</span>
          <span className="text-red-500 font-bold font-serif uppercase tracking-wider">
            {appState.replace('_', ' ')}
          </span>
        </div>
      </header>

      {/* Center Action (if needed) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        {photoCount === 0 && (
          <div className="animate-pulse text-stone-400 font-light">
            Upload photos to decorate the tree
          </div>
        )}
      </div>

      {/* Footer / Controls */}
      <div className="flex justify-between items-end pointer-events-auto">
        
        {/* Instructions */}
        <div className="bg-gradient-to-r from-black/80 to-transparent p-6 rounded-xl border-l-2 border-red-700 backdrop-blur-sm max-w-sm">
          <h3 className="text-yellow-600 font-serif mb-3 border-b border-stone-800 pb-2">Gesture Guide</h3>
          <ul className="space-y-2 text-sm text-stone-300 font-light">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_5px_red]"></span>
              <span><strong className="text-white">Fist:</strong> Close tree</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-600 shadow-[0_0_5px_green]"></span>
              <span><strong className="text-white">Open Hand:</strong> Scatter & Float</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_yellow]"></span>
              <span><strong className="text-white">Move Hand:</strong> Rotate View (in Scatter)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_blue]"></span>
              <span><strong className="text-white">Pinch:</strong> Grab & Zoom Photo</span>
            </li>
          </ul>
        </div>

        {/* Upload Control */}
        <div className="flex flex-col items-end gap-2">
           <label className="cursor-pointer group">
              <div className="bg-red-900/80 hover:bg-red-800 transition-colors px-6 py-3 rounded-lg border border-yellow-600/50 shadow-[0_0_15px_rgba(180,20,20,0.4)] flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-yellow-50 font-serif tracking-wide group-hover:text-white transition-colors">
                  Add Memories
                </span>
              </div>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => e.target.files && onUpload(e.target.files)}
              />
           </label>
           <div className="text-xs text-stone-500 font-mono text-right">
              {photoCount} photos loaded
           </div>
        </div>

      </div>
    </div>
  );
};

export default UIOverlay;