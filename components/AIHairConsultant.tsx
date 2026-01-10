
import React, { useState } from 'react';
import { analyzeStyle, generateHairstylePreview } from '../services/geminiService';
import { HairStyleRecommendation, User } from '../types';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  UPLOAD_PROGRESS_INTERVAL_MS,
  IMAGE_GENERATION_DELAY_MS
} from '../constants';

interface AIHairConsultantProps {
  currentUser?: User | null;
  onLoginRequired?: () => void;
  onClose?: () => void;
}

export const AIHairConsultant: React.FC<AIHairConsultantProps> = ({ currentUser, onLoginRequired, onClose }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false); // Global loading for initial text analysis
  const [recommendations, setRecommendations] = useState<HairStyleRecommendation[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Track which images are currently being generated (per card loading state)
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  
  // Track refinement prompts for each card
  const [refinementPrompts, setRefinementPrompts] = useState<Record<number, string>>({});

  // Drag & Drop and Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
        setError("Lütfen geçerli bir resim dosyası yükleyin.");
        return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setError(`Dosya boyutu çok büyük (${sizeMB}MB). Lütfen ${MAX_FILE_SIZE_MB}MB altı bir dosya yükleyin.`);
        return;
    }

    // Simulate progress for better UX
    setUploadProgress(10);
    const interval = setInterval(() => {
        setUploadProgress(prev => {
            if (prev >= 90) {
                clearInterval(interval);
                return 90;
            }
            return prev + 5;
        });
    }, UPLOAD_PROGRESS_INTERVAL_MS);

    const reader = new FileReader();
    reader.onloadend = () => {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setSelectedImage(reader.result as string);
        setUploadProgress(0);
      }, 600);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!description && !selectedImage) return;

    // Require login for analysis
    if (!currentUser) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    setLoading(true);
    setRecommendations([]);
    setGeneratingImages({});
    setRefinementPrompts({});
    setError(null);

    try {
      // 1. Get Text Recommendations & Placeholders first
      const results = await analyzeStyle(description, selectedImage || undefined);
      
      // Update UI immediately with text results
      setRecommendations(results);
      setLoading(false); // Stop main loading spinner

      // 2. If user uploaded an image, start generating realistic previews in background
      if (selectedImage && results.length > 0) {
        
        // Initialize loading state for all cards
        const initialGenState: Record<number, boolean> = {};
        results.forEach((_, idx) => initialGenState[idx] = true);
        setGeneratingImages(initialGenState);

        // Process images progressively (non-blocking)
        results.forEach(async (rec, index) => {
           try {
             // Delay slightly to avoid hitting rate limits instantly if multiple requests fire
             await new Promise(r => setTimeout(r, index * IMAGE_GENERATION_DELAY_MS)); 

             const generatedImage = await generateHairstylePreview(selectedImage, rec.name, rec.description);
             
             if (generatedImage) {
               setRecommendations(prev => {
                 const newRecs = [...prev];
                 // Ensure we are updating the correct index safely
                 if (newRecs[index]) {
                   newRecs[index] = { ...newRecs[index], imageUrl: generatedImage };
                 }
                 return newRecs;
               });
             }
           } catch (e) {
             console.error(`Image generation failed for index ${index}`, e);
           } finally {
             // Turn off loader for this specific card
             setGeneratingImages(prev => ({ ...prev, [index]: false }));
           }
        });
      }

    } catch (err) {
      console.error(err);
      alert("AI servisi şu anda yanıt veremiyor. Lütfen bilgilerinizi kontrol edip tekrar deneyin.");
      setLoading(false);
    }
  };

  const handleRefineStyle = async (index: number) => {
    const prompt = refinementPrompts[index];
    if (!prompt || !selectedImage) return;

    // Set loading for this specific index
    setGeneratingImages(prev => ({ ...prev, [index]: true }));

    try {
      const rec = recommendations[index];
      // Combine original description with refinement
      const combinedDescription = `${rec.description}. Modification request: ${prompt}`;

      const generatedImage = await generateHairstylePreview(selectedImage, rec.name, combinedDescription);

      if (generatedImage) {
        setRecommendations(prev => {
          const newRecs = [...prev];
          newRecs[index] = { ...newRecs[index], imageUrl: generatedImage };
          return newRecs;
        });
        setRefinementPrompts(prev => ({ ...prev, [index]: '' })); // Clear input on success
      }
    } catch (e) {
      console.error("Refinement failed", e);
      alert("Düzenleme sırasında bir hata oluştu.");
    } finally {
      setGeneratingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-4xl mx-auto pb-20 relative">
      
      {/* Close Button specific for this view */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 md:top-0 md:-right-12 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
          title="Ana Sayfaya Dön"
        >
          <Icon name="close" size={28} />
        </button>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif text-gold-400 flex items-center justify-center gap-2">
          <Icon name="sparkles" className="text-gold-400" />
          AI Stil Danışmanı
        </h2>
        <p className="text-gray-300">Yüz şekline ve tarzına en uygun saçı yapay zeka ile bul.</p>
      </div>

      <GlassCard className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Fotoğrafını Yükle</label>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 relative group overflow-hidden
                ${isDragging 
                  ? 'border-gold-500 bg-gold-500/10 scale-[1.02]' 
                  : 'border-gray-600 hover:border-gold-500 hover:bg-white/5'
                } ${error ? 'border-red-500/50' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {uploadProgress > 0 ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in transition-all">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-gold-500/30 animate-bounce">
                      <Icon name="upload" className="text-gold-400" size={24} />
                   </div>
                   <p className="text-lg font-serif text-white mb-1">Yükleniyor</p>
                   <p className="text-xs text-gold-400/80 mb-6 font-mono tracking-widest animate-pulse">GÖRÜNTÜ İŞLENİYOR...</p>
                   
                   {/* Progress Bar Container */}
                   <div className="w-48 sm:w-64 h-2 bg-gray-800 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
                      {/* Fill */}
                      <div 
                        className="h-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 transition-all duration-200 ease-out shadow-[0_0_15px_rgba(212,175,55,0.6)]"
                        style={{ width: `${uploadProgress}%` }}
                      />
                   </div>
                   <span className="mt-3 text-xs text-gray-400 font-medium">{uploadProgress}%</span>
                </div>
              ) : selectedImage ? (
                <div className="relative h-48 group-hover:opacity-50 transition-opacity">
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-lg" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <p className="text-white font-bold bg-black/50 px-3 py-1 rounded-full text-sm backdrop-blur-md border border-white/20">Değiştirmek için sürükleyin</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 transition-transform duration-300 group-hover:scale-105">
                  <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? 'bg-gold-500 text-black' : 'bg-white/5 text-gray-400 group-hover:text-gold-400 group-hover:bg-gold-500/20'}`}>
                    <Icon name="upload" size={32} />
                  </div>
                  <span className={`text-sm font-medium transition-colors ${isDragging ? 'text-gold-400' : 'text-gray-400 group-hover:text-white'}`}>
                    {isDragging ? 'Fotoğrafı Buraya Bırakın' : 'Fotoğrafı sürükleyin veya tıklayın'}
                  </span>
                  <span className="text-xs text-gray-500 mt-2">JPG, PNG (Max {MAX_FILE_SIZE_MB}MB)</span>
                </div>
              )}
              
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                disabled={uploadProgress > 0}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-fade-in flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg mt-2">
                <Icon name="close" size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Tarzını Anlat</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Modern, kısa, bakımı kolay bir saç istiyorum. Sakallarım gür..."
              className="w-full h-full min-h-[200px] glass-input rounded-xl p-4 resize-none border-2 border-transparent focus:border-gold-500/50 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || (!description && !selectedImage)}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
            ${loading 
              ? 'bg-gray-700 cursor-wait' 
              : 'bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40'
            }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <Icon name="sparkles" size={20} />
              Stilimi Bul
            </>
          )}
        </button>
      </GlassCard>

      {recommendations.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6 animate-slide-up">
          {recommendations.map((rec, idx) => (
            <GlassCard key={idx} className="group overflow-hidden border-gold-500/30 flex flex-col h-full">
              <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden bg-black/40">
                {generatingImages[idx] ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-sm bg-black/60 transition-all">
                      <div className="relative">
                        <div className="w-12 h-12 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-3"></div>
                        <Icon name="sparkles" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[65%] text-gold-400 animate-pulse" size={16} />
                      </div>
                      <span className="text-xs text-gold-400 font-medium animate-pulse tracking-wide">
                        {refinementPrompts[idx] ? 'Stil Güncelleniyor...' : 'Yüz İşleniyor...'}
                      </span>
                   </div>
                ) : null}
                
                <img 
                  src={rec.imageUrl} 
                  alt={rec.name} 
                  className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 
                    ${generatingImages[idx] ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'}`}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-4">
                  <h3 className="text-xl font-serif text-white shadow-black drop-shadow-md">{rec.name}</h3>
                </div>
              </div>
              <div className="flex-1 space-y-3 flex flex-col">
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{rec.description}</p>
                
                {/* Enhanced Info Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-white/5 rounded-lg p-3 flex flex-col items-center justify-center text-center border border-white/5 hover:border-gold-500/30 transition-colors">
                        <Icon name="user" className="text-gold-400 mb-1" size={16} />
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Yüz Şekli</span>
                        <span className="text-sm font-medium text-white">{rec.faceShapeMatch}</span>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 flex flex-col items-center justify-center text-center border border-white/5 hover:border-gold-500/30 transition-colors">
                        <Icon name="scissors" className="text-gold-400 mb-1" size={16} />
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Bakım</span>
                        <span className="text-sm font-medium text-white">{rec.maintenanceLevel}</span>
                    </div>
                </div>

                {/* Refinement Input */}
                <div className="mt-auto pt-4 border-t border-white/10">
                   <div className="relative group/input">
                       <input 
                          type="text" 
                          value={refinementPrompts[idx] || ''}
                          onChange={(e) => setRefinementPrompts(prev => ({...prev, [idx]: e.target.value}))}
                          onKeyDown={(e) => e.key === 'Enter' && handleRefineStyle(idx)}
                          disabled={generatingImages[idx]}
                          placeholder="Örn: Daha kısa yap, sakal ekle..."
                          className="w-full bg-black/30 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:border-gold-500 outline-none placeholder-gray-500 disabled:opacity-50 transition-all focus:bg-white/5"
                       />
                       <button
                          onClick={() => handleRefineStyle(idx)}
                          disabled={generatingImages[idx] || !refinementPrompts[idx]}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gold-400 hover:text-white disabled:opacity-30 transition-colors rounded-md hover:bg-gold-500/20"
                          title="Stili Güncelle"
                       >
                          <Icon name="sparkles" size={14} />
                       </button>
                   </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
