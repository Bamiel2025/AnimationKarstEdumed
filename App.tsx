import React, { useState, useEffect, useRef } from 'react';
import Hydrograph from './components/Hydrograph';
import FloodSimulation from './components/FloodSimulation';
import StationMap from './components/StationMap';
import Controls from './components/Controls';
import { SIMULATION_DATA, MAX_TIME } from './constants';
import { Info, Map as MapIcon, Box } from 'lucide-react';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState<'simulation' | 'map'>('simulation');
  
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | undefined>(undefined);

  const animate = (time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      setCurrentTime(prevTime => {
        const nextTime = prevTime + (deltaTime * 2 * playbackSpeed);
        if (nextTime >= MAX_TIME) {
          setIsPlaying(false);
          return MAX_TIME;
        }
        return nextTime;
      });
    }
    lastTimeRef.current = time;
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      lastTimeRef.current = undefined;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleSpeedChange = () => {
    setPlaybackSpeed(prev => prev >= 4 ? 1 : prev * 2);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">Crue de l'Huveaune</h1>
            <p className="text-xs text-slate-500">Ruissellement vs Karst</p>
          </div>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
                onClick={() => setActiveTab('simulation')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'simulation' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <Box size={16} />
                Simulation 3D
            </button>
            <button 
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'map' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <MapIcon size={16} />
                Carte Réelle
            </button>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
           <Info size={16} className="text-blue-600" />
           <span className="text-xs font-medium text-blue-800">Données scientifiques</span>
        </div>
      </header>

      {/* Main Content - Grid Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden relative">
        
        {/* Left Column: Visualization */}
        <div className="flex flex-col w-full h-[50vh] lg:h-full bg-slate-900 border-r border-slate-200">
           
           {/* Phase Bar (Moved from overlay) */}
           <div className={`flex-none w-full px-4 py-2 text-center text-sm font-bold tracking-wider uppercase transition-colors duration-500 border-b border-white/10 ${
              currentTime < 11 
              ? 'bg-sky-900 text-sky-200' 
              : 'bg-indigo-900 text-indigo-200'
           }`}>
               {currentTime < 11 ? 'Phase 1 : Ruissellement de Surface' : 'Phase 2 : Restitution Karstique'}
           </div>

           {/* Content */}
           <div className="flex-1 relative overflow-hidden">
               {activeTab === 'simulation' ? (
                   <FloodSimulation 
                      data={SIMULATION_DATA} 
                      currentTime={currentTime} 
                      isPlaying={isPlaying}
                      onTogglePlay={togglePlay}
                   />
               ) : (
                   <StationMap data={SIMULATION_DATA} currentTime={currentTime} />
               )}
           </div>
        </div>

        {/* Right Column: Charts & Details */}
        <div className="flex flex-col h-[50vh] lg:h-full bg-slate-50 overflow-y-auto">
           <div className="p-6 space-y-6">
              
              {/* Contextual Text Box */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                 <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Analyse Temps Réel (T+{currentTime.toFixed(1)}h)</h2>
                 <p className="text-sm text-slate-700 leading-relaxed font-medium">
                   {currentTime < 2 
                     ? "Début de l'épisode pluvieux. Saturation des sols en cours."
                     : currentTime < 11
                     ? "PHASE 1 (Ruissellement) : Les pluies intenses ruissellent sur les surfaces imperméables. L'onde de crue est générée LOCALEMENT. C'est pourquoi Marseille (aval) monte AVANT St Zacharie (amont). Regardez les flèches bleues sur la simulation."
                     : currentTime < 24
                     ? "PHASE 2 (Karst) : Le ruissellement diminue, mais l'aquifère du massif de la Sainte-Baume commence à se vidanger massivement. Une onde puissante part de la SOURCE (St Zacharie) et descend vers la mer. Regardez le pic bleu à St Zacharie sur le graph."
                     : "Décrue : Le système souterrain (Karst) continue de se vider lentement, maintenant des niveaux d'eau artificiellement hauts en amont."
                   }
                 </p>
              </div>

              {/* Chart */}
              <div className="flex-1 min-h-[350px]">
                 <Hydrograph data={SIMULATION_DATA} currentTime={currentTime} />
              </div>
           </div>
        </div>

      </main>

      {/* Footer Controls */}
      <footer className="flex-none z-20">
        <Controls 
          currentTime={currentTime} 
          maxTime={MAX_TIME} 
          isPlaying={isPlaying} 
          onPlayPause={togglePlay} 
          onSeek={handleSeek}
          onReset={handleReset}
          speed={playbackSpeed}
          onSpeedChange={handleSpeedChange}
        />
      </footer>
    </div>
  );
};

export default App;