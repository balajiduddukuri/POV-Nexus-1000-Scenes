import React, { useState } from 'react';
import { SceneConcept, ThemeMode } from '../types';

interface SceneCardProps {
  /** The data model for the scene */
  scene: SceneConcept;
  /** Current UI theme state */
  theme: ThemeMode;
  /** Callback to trigger thumbnail generation */
  onGenerateImage?: (id: number, description: string) => void;
  /** Callback to toggle favorite state */
  onToggleFavorite?: (id: number) => void;
  /** Callback to open the detail modal */
  onViewDetails?: (scene: SceneConcept) => void;
  /** Function to trigger the audio cue sound */
  playAudioCue?: () => void;
  /** Callback when share action completes */
  onShare?: () => void;
}

/**
 * SceneCard Component
 * Displays a single POV scene concept. Handles interaction logic for generating
 * visuals, favoriting, and sharing. Supports High Contrast accessibility mode.
 */
const SceneCard: React.FC<SceneCardProps> = ({ 
  scene, 
  theme,
  onGenerateImage, 
  onToggleFavorite, 
  onViewDetails,
  playAudioCue,
  onShare
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const isHighContrast = theme === 'high-contrast';

  // Extract Style if present (common in Curated Mode)
  // Looks for "Style: something." or "Style: something" at the end or middle
  const styleMatch = scene.description.match(/Style:\s*([^.]+)/i);
  const styleLabel = styleMatch ? styleMatch[1].trim() : null;
  // Remove the style text from the display description to keep it clean
  const cleanDescription = scene.description.replace(/Style:\s*[^.]+\.?/i, '').trim();

  // Determine color accent based on category - High contrast mode overrides this
  const getCategoryColor = (cat: string) => {
    if (isHighContrast) return 'border-white text-white';
    if (cat === 'Neon') return 'from-fuchsia-500/20 to-cyan-900/40 border-fuchsia-400 text-fuchsia-300';
    
    const colors = [
      'from-rose-500/20 to-rose-900/40 border-rose-500/50 text-rose-200',
      'from-blue-500/20 to-blue-900/40 border-blue-500/50 text-blue-200',
      'from-green-500/20 to-green-900/40 border-green-500/50 text-green-200',
      'from-purple-500/20 to-purple-900/40 border-purple-500/50 text-purple-200',
      'from-amber-500/20 to-amber-900/40 border-amber-500/50 text-amber-200',
      'from-cyan-500/20 to-cyan-900/40 border-cyan-500/50 text-cyan-200',
    ];
    const index = cat.length % colors.length;
    return colors[index];
  };

  const colorStyle = getCategoryColor(scene.category);
  const gradientClass = colorStyle.split(' ')[0] + ' ' + colorStyle.split(' ')[1];
  const textColor = isHighContrast ? 'text-white' : colorStyle.split(' ').pop();

  /**
   * Handles keyboard interaction for accessibility (Enter/Space to view details)
   */
  const handleInteract = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (scene.thumbnailUrl) onViewDetails?.(scene);
    }
  };

  /**
   * Handles sharing via Web Share API or Clipboard fallback
   */
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playAudioCue?.();

    const shareData: ShareData = {
      title: `POV Nexus: ${scene.category}`,
      text: `${scene.description} (Lighting: ${scene.lighting}, Camera: ${scene.camera})`,
      url: scene.thumbnailUrl || window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Share cancelled or failed, fall back silently
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        const textToCopy = `POV Nexus Scene:\n${scene.description}\n${scene.thumbnailUrl ? `Image: ${scene.thumbnailUrl}` : ''}`;
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        onShare?.(); // Trigger parent toast
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  return (
    <article 
      className={`
        relative group overflow-hidden rounded-xl flex flex-col h-full transition-all duration-300
        ${isHighContrast 
          ? 'bg-black border-4 border-white shadow-none' 
          : 'bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:border-slate-500 shadow-lg hover:shadow-2xl'}
        ${scene.isFavorite ? (isHighContrast ? 'border-dashed' : 'border-amber-500/50 shadow-amber-500/10') : ''}
      `}
      tabIndex={0}
      onKeyDown={handleInteract}
      aria-label={`Scene ${scene.id}: ${scene.category} concept`}
    >
      {/* Thumbnail / Placeholder Area */}
      <div 
        className={`w-full aspect-video relative overflow-hidden border-b ${isHighContrast ? 'border-white' : 'border-slate-700/50'}`}
        role="img" 
        aria-label={scene.thumbnailUrl ? "Generated scene preview" : "Abstract placeholder"}
        onClick={() => {
           if (scene.thumbnailUrl) {
             playAudioCue?.();
             onViewDetails?.(scene);
           }
        }}
      >
        {scene.thumbnailUrl ? (
          <>
            <img 
              src={scene.thumbnailUrl} 
              alt={scene.description} 
              className={`w-full h-full object-cover transition-transform duration-700 ${isHighContrast ? '' : 'group-hover:scale-105'}`}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${isHighContrast ? 'bg-black' : gradientClass} relative`}>
            {isHighContrast && (
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 10px)' }}></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-black uppercase tracking-widest transform -rotate-12 select-none ${isHighContrast ? 'text-white' : 'text-white/20'}`}>
                {scene.category}
              </span>
            </div>
          </div>
        )}

        <button 
          onClick={(e) => {
            e.stopPropagation();
            playAudioCue?.();
            onToggleFavorite?.(scene.id);
          }}
          className={`
            absolute top-2 right-2 z-30 p-2 rounded-full transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white
            ${isHighContrast ? 'bg-black border-2 border-white' : 'bg-black/20 hover:bg-black/40 backdrop-blur-md'}
          `}
          aria-label={scene.isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={scene.isFavorite}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill={scene.isFavorite ? (isHighContrast ? "white" : "#ef4444") : "none"} 
            stroke={scene.isFavorite ? (isHighContrast ? "white" : "#ef4444") : "white"} 
            className="w-5 h-5 drop-shadow-md"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {scene.isGeneratingThumbnail && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-20" role="status" aria-label="Generating thumbnail">
            <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-cyan-400 font-mono">RENDERING</span>
          </div>
        )}

        {!scene.thumbnailUrl && !scene.isGeneratingThumbnail && (
          <div className="absolute inset-0 flex items-center justify-center z-10 transition-colors bg-black/10 hover:bg-black/20">
             <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudioCue?.();
                  onGenerateImage?.(scene.id, scene.description);
                }}
                className={`
                  px-5 py-2.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-2
                  transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white
                  ${isHighContrast 
                    ? 'bg-black text-white border-2 border-white hover:bg-white hover:text-black' 
                    : 'bg-slate-900/60 text-white backdrop-blur-md border border-white/20 hover:border-cyan-400 hover:bg-cyan-600/90 hover:shadow-cyan-500/20'}
                `}
                aria-label={`Generate visual for ${scene.description}`}
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
               VISUALIZE
             </button>
          </div>
        )}
      </div>

      <div className={`p-5 flex flex-col flex-grow relative ${isHighContrast ? 'bg-black text-white' : ''}`}>
        <div className={`
          inline-block text-[10px] font-bold uppercase tracking-wider mb-2
          w-max px-2 py-0.5 rounded-sm border
          ${isHighContrast ? 'border-white bg-white text-black' : `bg-slate-900/50 ${textColor} border-opacity-30 border-white/10`}
        `}>
          {scene.category}
        </div>

        <p className={`text-sm font-medium leading-relaxed mb-4 flex-grow font-sans line-clamp-4 ${isHighContrast ? 'text-white' : 'text-slate-200'}`}>
          "{cleanDescription}"
        </p>

        <div className={`flex flex-wrap items-center gap-2 mt-auto pt-3 border-t ${isHighContrast ? 'border-white' : 'border-slate-700/30'}`}>
          {styleLabel && (
            <span className={`text-[10px] font-mono flex items-center gap-1 ${isHighContrast ? 'text-white border border-white px-1' : 'text-purple-300 bg-purple-900/20 px-1.5 py-0.5 rounded'}`} title="Art Style">
              <span aria-hidden="true">🎨</span> {styleLabel}
            </span>
          )}
          <span className={`text-[10px] font-mono flex items-center gap-1 ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>
            <span aria-hidden="true">🎥</span> {scene.camera}
          </span>
          <span className={`text-[10px] font-mono flex items-center gap-1 ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>
             <span aria-hidden="true">💡</span> {scene.lighting}
          </span>

          <button 
            onClick={handleShare}
            className={`
              ml-auto p-1.5 rounded-md transition-all text-xs flex items-center gap-1
              focus:outline-none focus:ring-1 focus:ring-white
              ${isHighContrast 
                ? 'text-white hover:bg-white hover:text-black border border-transparent hover:border-black' 
                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50'}
              ${isCopied ? (isHighContrast ? 'bg-white text-black' : 'text-green-400') : ''}
            `}
            title="Share scene"
            aria-label="Share this scene"
          >
            {isCopied ? (
              <span className="font-bold">COPIED</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default SceneCard;