import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequence timing
    const timers = [
      setTimeout(() => setStep(1), 500),  // Start Brand fade in
      setTimeout(() => setStep(2), 2000), // Start Welcome fade in
      setTimeout(() => setStep(3), 3500), // Start fade out
      setTimeout(() => onComplete(), 4500) // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${step === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Skip Button - Added for easy exit */}
      <button 
        onClick={onComplete}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm uppercase tracking-widest group"
      >
        Tanıtımı Atla
        <Icon name="chevronRight" size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="relative z-10 text-center px-4">
        {/* Brand Name */}
        <h1 
          className={`text-4xl md:text-6xl font-serif text-gold-400 tracking-widest mb-6 transition-all duration-1000 transform
            ${step >= 1 ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-10 blur-sm'}`}
        >
          TARIK YALÇIN
        </h1>
        
        <h2
          className={`text-xl md:text-3xl font-light text-white tracking-[0.3em] uppercase transition-all duration-1000 delay-300 transform
            ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          Hair Design
        </h2>

        {/* Separator Line */}
        <div 
          className={`w-32 h-[1px] bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto my-8 transition-all duration-1000 delay-500
          ${step >= 1 ? 'w-32 opacity-100' : 'w-0 opacity-0'}`} 
        />

        {/* Welcome Message */}
        <div 
          className={`text-2xl font-serif italic text-gray-300 transition-all duration-1000 transform
            ${step >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          Hoşgeldiniz
        </div>
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2070')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
    </div>
  );
};
