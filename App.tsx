import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SceneConcept, GenerationStats, ThemeMode, ToastMessage } from './types';
import { generateSceneBatch, generateCuratedBatch, generateSceneThumbnail, generateHighQualityImage } from './services/geminiService';
import { BATCH_SIZE, TOTAL_GOAL, CATEGORIES_LIST } from './constants';
import SceneCard from './components/SceneCard';
import Dashboard from './components/Dashboard';
import ImageModal from './components/ImageModal';
import ToastContainer from './components/Toast';

const ITEMS_PER_PAGE = 10;

const App: React.FC = () => {
  // --- State ---
  const [scenes, setScenes] = useState<SceneConcept[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('default');
  const [selectedScene, setSelectedScene] = useState<SceneConcept | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [stats, setStats] = useState<GenerationStats>({
    totalGenerated: 0,
    batchesCompleted: 0,
    isGenerating: false,
    startTime: null,
    elapsedTime: 0
  });

  // --- Refs ---
  const timerRef = useRef<number | null>(null);
  const stopRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // --- Utilities ---
  
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fixed Audio Context (Singleton Pattern) to prevent memory leaks
  const playAudioCue = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
        }
      }

      const ctx = audioContextRef.current;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }

      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }, []);

  // --- Generation Logic ---

  useEffect(() => {
    if (stats.isGenerating) {
      timerRef.current = window.setInterval(() => {
        setStats(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stats.isGenerating]);

  // The actual generation worker
  useEffect(() => {
    let isMounted = true;

    const generateStep = async () => {
      if (!stats.isGenerating || stopRef.current || scenes.length >= TOTAL_GOAL) {
        if (scenes.length >= TOTAL_GOAL && stats.isGenerating) {
          setStats(prev => ({ ...prev, isGenerating: false }));
          addToast("Generation Goal Reached!", "success");
        }
        return;
      }

      const currentCount = scenes.length;
      const remaining = TOTAL_GOAL - currentCount;
      const nextBatchSize = Math.min(BATCH_SIZE, remaining);
      const targetCategories = [...CATEGORIES_LIST].sort(() => 0.5 - Math.random()).slice(0, 5);

      try {
        const newBatch = await generateSceneBatch(currentCount + 1, nextBatchSize, targetCategories);
        
        if (isMounted && !stopRef.current) {
          setScenes(prev => [...prev, ...newBatch]);
          setStats(prev => ({
            ...prev,
            totalGenerated: prev.totalGenerated + newBatch.length,
            batchesCompleted: prev.batchesCompleted + 1
          }));
          
          // Logic loop triggers via dependency on stats.batchesCompleted
        }
      } catch (e) {
        console.error("Error in loop", e);
        if (isMounted) {
          stopRef.current = true;
          setStats(prev => ({ ...prev, isGenerating: false }));
          addToast("Generation failed. Check console.", "error");
        }
      }
    };

    generateStep();

    return () => { isMounted = false; };
  }, [stats.isGenerating, stats.batchesCompleted]);

  // --- Handlers ---

  const handleStart = () => {
    // Check key before starting text generation
    if (!window.aistudio?.hasSelectedApiKey()) {
        window.aistudio?.openSelectKey();
        return;
    }

    stopRef.current = false;
    // Don't clear scenes if resuming, only if starting from 0
    if (scenes.length === 0) {
      setStats(prev => ({ ...prev, isGenerating: true, startTime: Date.now(), totalGenerated: 0, batchesCompleted: 0, elapsedTime: 0 }));
    } else {
      setStats(prev => ({ ...prev, isGenerating: true }));
    }
    addToast("AI Generation Started", "info");
  };

  const handleInstantLoad = () => {
    stopRef.current = true;
    const curatedScenes = generateCuratedBatch(1, TOTAL_GOAL);
    setScenes(curatedScenes);
    setStats({
      totalGenerated: curatedScenes.length,
      batchesCompleted: Math.ceil(curatedScenes.length / BATCH_SIZE),
      isGenerating: false,
      startTime: Date.now(),
      elapsedTime: 1
    });
    addToast("Instant Gallery Loaded", "success");
  };

  const handleStop = () => { 
    stopRef.current = true; 
    setStats(prev => ({ ...prev, isGenerating: false })); 
    addToast("Generation Stopped", "info");
  };

  const handleGenerateImage = async (id: number, description: string) => {
    if (!window.aistudio?.hasSelectedApiKey()) {
       try {
         await window.aistudio?.openSelectKey();
         if (!window.aistudio?.hasSelectedApiKey()) return;
       } catch (e) { return; }
    }

    setScenes(prev => prev.map(s => s.id === id ? { ...s, isGeneratingThumbnail: true } : s));
    
    try {
      const imageUrl = await generateSceneThumbnail(description);
      
      if (imageUrl) {
        setScenes(prev => prev.map(s => s.id === id ? { ...s, isGeneratingThumbnail: false, thumbnailUrl: imageUrl } : s));
        addToast("Visualize Complete", "success");
      } else {
        throw new Error("No image data");
      }
    } catch (error: any) {
      setScenes(prev => prev.map(s => s.id === id ? { ...s, isGeneratingThumbnail: false } : s));
      const isPermission = error?.message?.includes('PERMISSION_DENIED') || error?.toString().includes('403');
      addToast(isPermission ? "Model Permission Denied. Check Key." : "Visualization Failed", "error");
    }
  };

  const handleGenerateHighRes = async () => {
    if (!selectedScene) return;
    
    if (!window.aistudio?.hasSelectedApiKey()) {
       try {
         await window.aistudio?.openSelectKey();
         if (!window.aistudio?.hasSelectedApiKey()) return;
       } catch (e) { return; }
    }

    setScenes(prev => prev.map(s => s.id === selectedScene.id ? { ...s, isGeneratingHighRes: true } : s));
    setSelectedScene(prev => prev ? { ...prev, isGeneratingHighRes: true } : null);

    try {
      const url = await generateHighQualityImage(selectedScene.description);
      if (url) {
        const updatedScene = { ...selectedScene, highResUrl: url, isGeneratingHighRes: false };
        setSelectedScene(updatedScene);
        setScenes(prev => prev.map(s => s.id === selectedScene.id ? updatedScene : s));
        addToast("High-Res Image Complete (2K)", "success");
      } else {
        throw new Error("No image returned");
      }
    } catch (e: any) {
      setScenes(prev => prev.map(s => s.id === selectedScene.id ? { ...s, isGeneratingHighRes: false } : s));
      setSelectedScene(prev => prev ? { ...prev, isGeneratingHighRes: false } : null);
      const isPermission = e?.message?.includes('PERMISSION_DENIED') || e?.toString().includes('403');
      addToast(isPermission ? "Model Permission Denied. Check Key." : "Generation Failed", "error");
    }
  };

  const handleToggleFavorite = (id: number) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handleDownloadList = () => {
    const scenesToExport = showFavorites ? scenes.filter(s => s.isFavorite) : scenes;
    const textContent = scenesToExport.map(s => `${s.id}. [${s.category}] ${s.description}`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pov-nexus-list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast("List Downloaded", "success");
  };

  const handleGeneratePageThumbnails = async () => {
    if (!window.aistudio?.hasSelectedApiKey()) {
        await window.aistudio?.openSelectKey();
        return;
    }

    addToast("Batch Loading Visuals...", "info");
    const filteredScenes = showFavorites ? scenes.filter(s => s.isFavorite) : scenes;
    const displayedScenes = filteredScenes.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    
    // Process sequentially to be nice to rate limits
    for (const scene of displayedScenes) {
       if (!scene.thumbnailUrl || scene.thumbnailUrl.includes('picsum')) { // Check if missing or placeholder
         await handleGenerateImage(scene.id, scene.description);
       }
    }
  };

  // --- Modal Logic ---
  const openModal = (scene: SceneConcept) => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setSelectedScene(scene);
  };

  const closeModal = () => {
    setSelectedScene(null);
    // Restore focus
    setTimeout(() => {
      previousFocusRef.current?.focus();
    }, 50);
  };

  // --- Pagination Logic ---
  const filteredScenes = showFavorites ? scenes.filter(s => s.isFavorite) : scenes;
  const totalPages = Math.ceil(filteredScenes.length / ITEMS_PER_PAGE);
  const displayedScenes = filteredScenes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page if filtering changes
  useEffect(() => {
    setCurrentPage(1);
  }, [showFavorites]);

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'high-contrast' ? 'bg-black text-white' : 'bg-slate-900 text-slate-100'}`}>
      <ToastContainer toasts={toasts} removeToast={removeToast} theme={theme} />
      
      <Dashboard 
        stats={stats} 
        showFavorites={showFavorites}
        theme={theme}
        onStart={handleStart} 
        onInstantLoad={handleInstantLoad}
        onStop={handleStop}
        onDownload={handleDownloadList}
        onToggleShowFavorites={() => setShowFavorites(!showFavorites)}
        onToggleTheme={() => setTheme(prev => prev === 'default' ? 'high-contrast' : 'default')}
        favoriteCount={scenes.filter(s => s.isFavorite).length}
        playAudioCue={playAudioCue}
      />

      <main id="main-content" className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-8 outline-none" tabIndex={-1}>
        {scenes.length === 0 && !stats.isGenerating ? (
          <div className="text-center mt-32 animate-fade-in">
             <div className={`inline-block p-8 rounded-2xl border ${theme === 'high-contrast' ? 'border-white bg-black' : 'bg-slate-800/50 border-slate-700'} max-w-2xl`}>
                <h2 className="text-3xl font-bold mb-4">Initialize the Nexus</h2>
                <p className={`mb-8 leading-relaxed ${theme === 'high-contrast' ? 'text-white' : 'text-slate-400'}`}>
                  Generate 1000 unique cinematic POV concepts.
                  <br/><br/>
                  <span className={`${theme === 'high-contrast' ? 'underline' : 'text-cyan-400'} font-bold`}>AI GENERATE:</span> Create fresh concepts using Gemini Flash.
                  <br/>
                  <span className={`${theme === 'high-contrast' ? 'underline' : 'text-purple-400'} font-bold`}>INSTANT:</span> Load curated art-fusion collection with previews.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <button onClick={() => { playAudioCue(); handleStart(); }} className={`px-8 py-4 font-bold rounded-xl text-lg transition-transform hover:scale-105 border-2 ${theme === 'high-contrast' ? 'border-white bg-black text-white hover:bg-white hover:text-black' : 'bg-cyan-600 border-transparent text-white shadow-xl'}`}>AI Generate</button>
                  <button onClick={() => { playAudioCue(); handleInstantLoad(); }} className={`px-8 py-4 font-bold rounded-xl text-lg transition-transform hover:scale-105 border-2 ${theme === 'high-contrast' ? 'border-white bg-white text-black hover:bg-black hover:text-white' : 'bg-purple-600 border-transparent text-white shadow-xl'}`}>Instant Load</button>
                </div>
             </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
               <h2 className={`text-xl font-bold ${theme === 'high-contrast' ? 'text-white' : 'text-slate-300'}`}>
                 {showFavorites ? 'Favorites Collection' : 'Generated Gallery'} 
                 <span className="text-sm font-normal opacity-70 ml-2">({filteredScenes.length} Items)</span>
               </h2>
               
               <div className="flex gap-4 items-center">
                 {/* Batch Visuals Button */}
                 {scenes.length > 0 && !showFavorites && (
                    <button 
                      onClick={handleGeneratePageThumbnails}
                      className={`text-xs font-bold px-4 py-2 rounded-lg border flex items-center gap-2 ${theme === 'high-contrast' ? 'border-white hover:bg-white hover:text-black' : 'border-slate-600 bg-slate-800 hover:bg-cyan-900/50 text-cyan-400'}`}
                      title="Generate visuals for current page"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      LOAD VISUALS
                    </button>
                 )}

                 {/* Pagination Controls Top */}
                 {totalPages > 1 && (
                   <div className="flex gap-2 items-center">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded border disabled:opacity-30 ${theme === 'high-contrast' ? 'border-white' : 'border-slate-600 bg-slate-800 hover:bg-slate-700'}`}
                      >
                        ←
                      </button>
                      <span className="font-mono text-sm">Page {currentPage} / {totalPages}</span>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded border disabled:opacity-30 ${theme === 'high-contrast' ? 'border-white' : 'border-slate-600 bg-slate-800 hover:bg-slate-700'}`}
                      >
                        →
                      </button>
                   </div>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedScenes.map((scene) => (
                <SceneCard 
                  key={scene.id} 
                  scene={scene} 
                  theme={theme}
                  onGenerateImage={handleGenerateImage}
                  onToggleFavorite={handleToggleFavorite}
                  onViewDetails={openModal}
                  playAudioCue={playAudioCue}
                  onShare={() => addToast("Link copied to clipboard", "success")}
                />
              ))}
            </div>

            {/* Pagination Controls Bottom */}
            {totalPages > 1 && (
                 <div className="flex justify-center gap-4 items-center mt-12">
                    <button 
                      onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded border disabled:opacity-30 ${theme === 'high-contrast' ? 'border-white' : 'border-slate-600 bg-slate-800 hover:bg-slate-700'}`}
                    >
                      Previous
                    </button>
                    <span className="font-mono">Page {currentPage} of {totalPages}</span>
                    <button 
                      onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded border disabled:opacity-30 ${theme === 'high-contrast' ? 'border-white' : 'border-slate-600 bg-slate-800 hover:bg-slate-700'}`}
                    >
                      Next
                    </button>
                 </div>
            )}
          </>
        )}
      </main>

      {/* Modal for High Res */}
      {selectedScene && (
        <ImageModal 
          scene={selectedScene} 
          theme={theme}
          onClose={closeModal}
          onGenerateHighRes={handleGenerateHighRes}
        />
      )}
      
      <footer className={`mt-auto py-6 text-center text-sm border-t ${theme === 'high-contrast' ? 'bg-black border-white text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
         <p>Created by BalajiDuddukuri | Data Source: Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
};

export default App;