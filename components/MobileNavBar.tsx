
import React from 'react';
import { Icon } from './Icon';
import { User, UserRole } from '../types';

type View = 'DASHBOARD' | 'BOOKING' | 'AI_CONSULT';

interface MobileNavBarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ 
  currentView, 
  setCurrentView, 
  currentUser,
  onLoginClick,
  onLogoutClick
}) => {
  
  const navItemClass = (isActive: boolean) => `
    flex flex-col items-center justify-center w-full h-full space-y-1
    transition-colors duration-200
    ${isActive ? 'text-gold-400' : 'text-gray-500 hover:text-gray-300'}
  `;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-xl border-t border-white/10 z-50 pb-safe-bottom">
      <div className="flex justify-around items-center h-full px-2">
        
        {/* Home / Dashboard */}
        <button 
          onClick={() => setCurrentView('DASHBOARD')}
          className={navItemClass(currentView === 'DASHBOARD')}
        >
          <Icon name={currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.STAFF ? 'shield' : 'scissors'} size={24} />
          <span className="text-[10px] uppercase font-bold tracking-wider">
             {currentUser?.role === UserRole.ADMIN ? 'Panel' : 'Ana Sayfa'}
          </span>
        </button>

        {/* AI Consultant */}
        <button 
          onClick={() => setCurrentView('AI_CONSULT')}
          className={navItemClass(currentView === 'AI_CONSULT')}
        >
          <Icon name="sparkles" size={24} />
          <span className="text-[10px] uppercase font-bold tracking-wider">AI Stil</span>
        </button>

        {/* Login / Profile Action */}
        {currentUser ? (
             <button 
               onClick={onLogoutClick}
               className={navItemClass(false)}
             >
               <div className="relative">
                 <img 
                    src={currentUser.avatar || 'https://via.placeholder.com/150'} 
                    alt="Profile" 
                    className="w-6 h-6 rounded-full border border-gold-500/50" 
                 />
                 <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>
               </div>
               <span className="text-[10px] uppercase font-bold tracking-wider">Çıkış</span>
             </button>
        ) : (
            <button 
              onClick={onLoginClick}
              className={navItemClass(false)}
            >
              <Icon name="user" size={24} />
              <span className="text-[10px] uppercase font-bold tracking-wider">Giriş</span>
            </button>
        )}

      </div>
    </div>
  );
};
