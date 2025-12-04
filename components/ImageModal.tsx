import React, { useEffect, useRef, useState } from 'react';
import { SceneConcept, ThemeMode } from '../types';

interface ImageModalProps {
  scene: SceneConcept;
  onClose: () => void;
  onGenerateHighRes: () => void;
  theme: ThemeMode;
}

const ImageModal: React.FC<ImageModalProps> = ({ scene, onClose, onGenerateHighRes, theme }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Trap focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    const url = scene.highResUrl || scene.thumbnailUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `pov-nexus-image-${scene.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    const url = scene.highResUrl || scene.thumbnailUrl || window.location.href;
    const shareData: ShareData = {
      title: `POV Nexus Scene #${scene.id}`,
      text: `${scene.description} (POV Nexus AI Art)`,
      url: url
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${scene.description}\n${url}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const isHighContrast = theme === 'high-contrast';

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative w-full max-w-5xl max-h-[90vh] flex flex-col 
          ${isHighContrast ? 'bg-black border-2 border-white' : 'bg-slate-900 border border-slate-700'} 
          rounded-2xl overflow-hidden shadow-2xl outline-none
        `}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-4 border-b ${isHighContrast ? 'border-white' : 'border-slate-800'}`}>
          <h2 id="modal-title" className={`text-xl font-bold ${isHighContrast ? 'text-white' : 'text-slate-100'}`}>
            Scene #{scene.id} Detail
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isHighContrast ? 'text-white border border-white' : 'text-slate-400'}`}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Image Area */}
        <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-4 relative group">
          <img 
            src={scene.highResUrl || scene.thumbnailUrl} 
            alt={scene.description}
            className="max-w-full max-h-[70vh] object-contain shadow-2xl"
          />
          {scene.isGeneratingHighRes && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
              <div className="w-12 h-12 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
              <span className="text-cyan-400 font-mono animate-pulse">GENERATING IMAGE...</span>
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className={`p-6 border-t ${isHighContrast ? 'border-white bg-black' : 'border-slate-800 bg-slate-900'}`}>
          <p className={`mb-6 text-lg ${isHighContrast ? 'text-white' : 'text-slate-300'}`}>
            {scene.description}
          </p>
          
          <div className="flex flex-wrap gap-4 justify-end">
             {/* Share Button */}
             <button 
              onClick={handleShare}
              className={`
                px-6 py-3 rounded-lg font-bold flex items-center gap-2
                ${isHighContrast 
                  ? 'border-2 border-white text-white hover:bg-white hover:text-black' 
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}
                transition-all focus:ring-2 ring-offset-2 ring-slate-500
              `}
              title="Share image"
            >
              {isCopied ? (
                <>
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </>
              )}
            </button>

            {/* Download Button */}
            <button 
              onClick={handleDownload}
              className={`
                px-6 py-3 rounded-lg font-bold flex items-center gap-2
                ${isHighContrast 
                  ? 'border-2 border-white text-white hover:bg-white hover:text-black' 
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}
                transition-all focus:ring-2 ring-offset-2 ring-slate-500
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
            
            {!scene.highResUrl && (
              <button 
                onClick={onGenerateHighRes}
                disabled={scene.isGeneratingHighRes}
                className={`
                  px-6 py-3 rounded-lg font-bold flex items-center gap-2
                  ${isHighContrast
                    ? 'bg-white text-black border-2 border-white hover:bg-gray-200'
                    : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/30'}
                  transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                  focus:ring-2 ring-offset-2 ring-purple-500
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Generate Image (Flash)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;