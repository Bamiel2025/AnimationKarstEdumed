import React from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

interface ControlsProps {
  currentTime: number;
  maxTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  currentTime,
  maxTime,
  isPlaying,
  onPlayPause,
  onSeek,
  onReset,
  speed,
  onSpeedChange
}) => {
  const percentage = (currentTime / maxTime) * 100;

  return (
    <div className="w-full bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
        
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onPlayPause}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md flex items-center justify-center"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          
          <button 
            onClick={onReset}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            title="Réinitialiser"
          >
            <RotateCcw size={18} />
          </button>

          <button 
            onClick={onSpeedChange}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
            title="Vitesse"
          >
            <FastForward size={12} /> {speed}x
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 w-full flex flex-col gap-2">
           <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Début épisode (T0)</span>
              <span>Fin (T+48h)</span>
           </div>
           <div className="relative w-full h-2 bg-slate-200 rounded-full cursor-pointer group">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-75 ease-linear"
                style={{ width: `${percentage}%` }}
              />
              <input 
                type="range" 
                min="0" 
                max={maxTime} 
                step="0.1"
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {/* Tooltip for slider */}
              <div 
                className="absolute top-[-25px] transform -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${percentage}%` }}
              >
                T+{currentTime.toFixed(1)}h
              </div>
           </div>
        </div>

        {/* Time Display */}
        <div className="min-w-[120px] text-right">
            <div className="text-sm font-bold text-slate-800">
                T + {Math.floor(currentTime)}h {Math.floor((currentTime % 1) * 60)}m
            </div>
            <div className="text-xs text-slate-500">
                Temps écoulé
            </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;