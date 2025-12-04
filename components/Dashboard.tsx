import React from 'react';
import { GenerationStats, ThemeMode } from '../types';
import { TOTAL_GOAL } from '../constants';

interface DashboardProps {
  stats: GenerationStats;
  showFavorites: boolean;
  theme: ThemeMode;
  onStart: () => void;
  onInstantLoad: () => void;
  onStop: () => void;
  onDownload: () => void;
  onToggleShowFavorites: () => void;
  onToggleTheme: () => void;
  favoriteCount: number;
  playAudioCue: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  stats, 
  showFavorites,
  theme,
  onStart, 
  onInstantLoad, 
  onStop, 
  onDownload,
  onToggleShowFavorites,
  onToggleTheme,
  favoriteCount,
  playAudioCue
}) => {
  const progressPercent = Math.min((stats.totalGenerated / TOTAL_GOAL) * 100, 100);
  const isHighContrast = theme === 'high-contrast';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAction = (action: () => void) => {
    playAudioCue();
    action();
  };

  return (
    <header className={`sticky top-0 z-50 ${isHighContrast ? 'bg-black border-b-2 border-white' : 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-2xl'} py-4`}>
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black font-bold rounded">
        Skip to content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex flex-col md:flex-row items-center justify-between gap-4" aria-label="Main Navigation">
          
          {/* Brand */}
          <div className="flex flex-col items-start min-w-[140px]">
            <h1 className={`text-2xl font-bold cursor-pointer select-none ${isHighContrast ? 'text-white uppercase tracking-widest' : 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500'}`} onClick={() => window.location.reload()}>
              POV NEXUS
            </h1>
            <p className={`text-xs ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>
              Cinematic Concept Generator
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className="flex-1 w-full md:w-auto md:mx-8" role="status" aria-label={`Generation Progress: ${progressPercent.toFixed(0)}%`}>
             <div className={`flex justify-between text-xs mb-1 font-mono ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>
                <span>PROGRESS</span>
                <span>{stats.totalGenerated} / {TOTAL_GOAL}</span>
             </div>
             <div className={`h-3 w-full rounded-full overflow-hidden border ${isHighContrast ? 'bg-black border-white' : 'bg-slate-800 border-slate-700'}`}>
                <div 
                  className={`h-full transition-all duration-500 ease-out ${isHighContrast ? 'bg-white' : 'bg-gradient-to-r from-cyan-500 to-purple-600'}`}
                  style={{ width: `${progressPercent}%` }}
                />
             </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
             <div className={`hidden lg:flex flex-col items-end mr-2 ${isHighContrast ? 'text-white' : 'text-slate-200'}`}>
                <span className="text-xs font-mono opacity-70">ELAPSED</span>
                <span className="text-sm font-mono">{formatTime(stats.elapsedTime)}</span>
             </div>

             {/* Theme Toggle */}
             <button
                onClick={() => handleAction(onToggleTheme)}
                className={`p-2 rounded-lg border font-bold text-xs ${isHighContrast ? 'bg-white text-black border-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}
                aria-label={isHighContrast ? "Switch to Default Mode" : "Switch to High Contrast Mode"}
             >
                {isHighContrast ? 'HC ON' : 'HC OFF'}
             </button>

             {/* Favorites Toggle */}
             {stats.totalGenerated > 0 && (
               <button
                 onClick={() => handleAction(onToggleShowFavorites)}
                 className={`
                   px-3 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 border
                   ${showFavorites 
                     ? (isHighContrast ? 'bg-white text-black border-white' : 'bg-amber-500/10 border-amber-500/50 text-amber-400') 
                     : (isHighContrast ? 'bg-black text-white border-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200')}
                 `}
                 aria-pressed={showFavorites}
                 title="Filter Favorites"
               >
                 <span>♥ {favoriteCount}</span>
               </button>
             )}

             {!stats.isGenerating && stats.totalGenerated < TOTAL_GOAL && (
               <>
                 <button 
                   onClick={() => handleAction(onStart)}
                   className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 border ${isHighContrast ? 'bg-black text-white border-white hover:bg-white hover:text-black' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 border-transparent'}`}
                 >
                   {stats.totalGenerated === 0 ? 'AI START' : 'RESUME'}
                 </button>
                 <button 
                   onClick={() => handleAction(onInstantLoad)}
                   className={`hidden sm:flex px-6 py-2 rounded-lg font-bold text-sm transition-all items-center gap-2 border ${isHighContrast ? 'bg-black text-white border-white hover:bg-white hover:text-black' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 border-transparent'}`}
                 >
                   INSTANT
                 </button>
               </>
             )}

             {stats.isGenerating && (
               <button 
                 onClick={() => handleAction(onStop)}
                 className={`px-6 py-2 rounded-lg font-bold text-sm transition-all border ${isHighContrast ? 'bg-white text-black border-white' : 'bg-red-900/80 hover:bg-red-800 text-red-200 border-red-700'}`}
               >
                 STOP
               </button>
             )}
             
             {stats.totalGenerated > 0 && !stats.isGenerating && (
                <button 
                  onClick={() => handleAction(onDownload)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm border ${isHighContrast ? 'bg-black text-white border-white hover:bg-white hover:text-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'}`}
                  aria-label="Download list as text"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
             )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Dashboard;