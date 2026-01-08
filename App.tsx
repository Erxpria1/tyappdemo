
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from './types';
import { APP_NAME } from './constants';
import { getUsers, seedUsersIfEmpty } from './services/dbService';
import { GlassCard } from './components/GlassCard';
import { Icon } from './components/Icon';
import { AIHairConsultant } from './components/AIHairConsultant';
import { AdminPanel } from './components/AdminPanel';
import { IntroAnimation } from './components/IntroAnimation';
import { BookingWizard } from './components/BookingWizard';
import { AdminLoginModal, CustomerLoginModal } from './components/LoginModals';
import { CustomerAppointments } from './components/CustomerAppointments';
import { MobileNavBar } from './components/MobileNavBar'; // New Mobile Component

type View = 'DASHBOARD' | 'BOOKING' | 'AI_CONSULT';

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');

  // Login Modals State
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Load users from Firebase on mount AND ensure Admin exists
  useEffect(() => {
    const initApp = async () => {
      try {
        await seedUsersIfEmpty();
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (e) {
        console.error("Failed to load users", e);
        // Don't block the app if Firebase fails - show degraded experience
        setInitError("Veritabanı bağlantısı başarısız. Bazı özellikler çalışmayabilir.");
        // Set a timeout to clear error and allow app to continue
        setTimeout(() => setInitError(null), 5000);
      } finally {
        setLoadingUsers(false);
      }
    };
    initApp();
  }, []);

  // Safe intro completion handler that prevents hanging
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setShowCustomerLogin(false);
    setShowAdminLogin(false);

    if (user.role === UserRole.ADMIN || user.role === UserRole.STAFF) {
        setCurrentView('DASHBOARD');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
  };

  const handleBookingClick = () => {
    if (!currentUser) {
      setShowCustomerLogin(true);
    } else {
      setCurrentView('BOOKING');
    }
  };
  
  const renderContent = () => {
    return (
      <div className="flex flex-col min-h-screen">
        
        {/* DESKTOP Navbar (Hidden on Mobile) */}
        <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 backdrop-blur-xl transition-all">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              
              {/* Logo */}
              <div 
                className="flex items-center gap-2 cursor-pointer group select-none" 
                onClick={() => setCurrentView('DASHBOARD')}
              >
                <div className="p-2 rounded-lg bg-gold-500/10 group-hover:bg-gold-500/20 transition-colors">
                  <Icon name="scissors" className="text-gold-400" size={24} />
                </div>
                <div className="flex flex-col">
                   <span className="text-lg font-serif tracking-wide font-bold leading-none">{APP_NAME}</span>
                   <span className="text-[0.6rem] text-gray-400 tracking-[0.2em] uppercase leading-none mt-1">Hair Design</span>
                </div>
              </div>
              
              {/* Desktop Menu Links */}
              <div className="flex items-center gap-8">
                <button 
                  onClick={() => setCurrentView('DASHBOARD')}
                  className={`text-sm uppercase tracking-widest hover:text-gold-400 transition-colors relative py-2 ${currentView === 'DASHBOARD' ? 'text-gold-400' : 'text-gray-300'}`}
                >
                  Ana Sayfa
                  {currentView === 'DASHBOARD' && <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gold-400 shadow-[0_0_10px_rgba(212,175,55,0.5)]"></span>}
                </button>
                <button 
                  onClick={() => setCurrentView('AI_CONSULT')}
                  className={`text-sm uppercase tracking-widest hover:text-gold-400 transition-colors relative py-2 ${currentView === 'AI_CONSULT' ? 'text-gold-400' : 'text-gray-300'}`}
                >
                  AI Stilist
                  {currentView === 'AI_CONSULT' && <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gold-400 shadow-[0_0_10px_rgba(212,175,55,0.5)]"></span>}
                </button>
                
                <div className="flex items-center gap-4 pl-8 border-l border-white/10">
                   {currentUser ? (
                     <>
                       <div className="text-right">
                         <div className="text-sm font-medium text-white">{currentUser.name}</div>
                         <div className="text-xs text-gold-500 uppercase font-bold tracking-wider">{currentUser.role}</div>
                       </div>
                       <img src={currentUser.avatar || 'https://via.placeholder.com/150'} alt="Profile" className="w-10 h-10 rounded-full border border-gold-500/50" />
                       <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors" title="Çıkış Yap">
                         <Icon name="logout" size={20} />
                       </button>
                     </>
                   ) : (
                     <button 
                      onClick={() => setShowCustomerLogin(true)}
                      className="px-6 py-2 bg-gold-500/10 hover:bg-gold-500 text-gold-400 hover:text-black border border-gold-500 rounded-lg transition-all text-sm font-bold tracking-wide"
                     >
                       Giriş Yap
                     </button>
                   )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* MOBILE Top Bar (Simpler Logo) */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 h-16 flex items-center justify-center">
            <div className="flex items-center gap-2" onClick={() => setCurrentView('DASHBOARD')}>
                <Icon name="scissors" className="text-gold-400" size={20} />
                <span className="text-lg font-serif font-bold text-white tracking-widest">{APP_NAME}</span>
            </div>
        </div>

        {/* Main Content Area */}
        {/* Added standard mobile padding (pt-20 for top bar, pb-24 for bottom nav) */}
        <main className="flex-1 pt-20 md:pt-28 pb-24 md:pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          
          {/* Admin Dashboard */}
          {currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.STAFF) && currentView === 'DASHBOARD' ? (
            <AdminPanel />
          ) : (
             /* Customer View */
             currentView === 'DASHBOARD' && (
              <div className="space-y-6 md:space-y-8 animate-slide-up">
                
                {/* Mobile Welcome Header */}
                <div className="md:hidden text-center space-y-2 mb-4">
                     <h2 className="text-2xl font-serif text-white">
                        {currentUser ? `Merhaba, ${currentUser.name.split(' ')[0]}` : 'Hoşgeldiniz'}
                     </h2>
                     <p className="text-gray-400 text-sm">TYRANDEVU Premium Deneyimi</p>
                </div>

                {/* Desktop Welcome Header */}
                <div className="hidden md:flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6">
                  <div>
                    <h2 className="text-4xl font-serif text-white">
                      {currentUser ? `Hoşgeldiniz, ${currentUser.name}` : 'Stilinizi Keşfedin'}
                    </h2>
                    <p className="text-gray-400 mt-2 text-lg">
                      {currentUser ? 'Bugün kendin için bir iyilik yap.' : 'Premium saç tasarımı ve kişisel bakım deneyimi.'}
                    </p>
                  </div>
                  {currentUser?.role === UserRole.CUSTOMER && (
                     <div className="px-4 py-2 bg-gold-500/10 border border-gold-500/20 rounded-full text-gold-400 text-sm flex items-center gap-2">
                       <Icon name="check" size={16} /> Premium Üye
                     </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* AI Consultant Card */}
                  <GlassCard 
                    onClick={() => setCurrentView('AI_CONSULT')}
                    className="group min-h-[200px] md:min-h-[300px] flex flex-col justify-center items-center text-center p-6 md:p-8 border-gold-500/20 active:scale-95 md:active:scale-100 md:hover:border-gold-500/50 bg-gradient-to-br from-white/5 to-transparent hover:to-gold-500/5 relative overflow-hidden transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                      <Icon name="sparkles" size={80} className="text-white/5" />
                    </div>
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gold-500/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500 border border-gold-500/20 z-10">
                      <Icon name="sparkles" size={32} className="text-gold-400 md:w-12 md:h-12" />
                    </div>
                    <h3 className="text-xl md:text-3xl font-serif text-white mb-2 z-10">AI Stil Danışmanı</h3>
                    <p className="text-gray-400 text-sm md:text-base max-w-xs mx-auto leading-relaxed z-10">Yüz şekline en uygun saç modelini keşfet.</p>
                    <button className="mt-4 md:mt-6 px-6 py-2 bg-white/5 md:hover:bg-gold-500 md:hover:text-black rounded-full text-sm transition-colors z-10 border border-white/10">
                      Hemen Dene
                    </button>
                  </GlassCard>

                  {/* Booking Card */}
                  <GlassCard 
                    onClick={handleBookingClick}
                    className="group min-h-[200px] md:min-h-[300px] flex flex-col justify-center items-center text-center p-6 md:p-8 border-white/10 active:scale-95 md:active:scale-100 md:hover:border-white/30 bg-gradient-to-bl from-white/5 to-transparent hover:to-white/10 relative overflow-hidden transition-all duration-300"
                  >
                     <div className="absolute top-0 left-0 p-4 opacity-50">
                      <Icon name="calendar" size={80} className="text-white/5" />
                    </div>
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/5 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/10 z-10">
                      <Icon name="calendar" size={32} className="text-white md:w-12 md:h-12" />
                    </div>
                    <h3 className="text-xl md:text-3xl font-serif text-white mb-2 z-10">Randevu Oluştur</h3>
                    <p className="text-gray-400 text-sm md:text-base max-w-xs mx-auto leading-relaxed z-10">Hızlıca yerini ayırt.</p>
                    <button className="mt-4 md:mt-6 px-6 py-2 bg-white/5 md:hover:bg-white md:hover:text-black rounded-full text-sm transition-colors z-10 border border-white/10">
                      Randevu Al
                    </button>
                  </GlassCard>
                </div>
                
                {/* --- Customer Appointments Section --- */}
                {currentUser && currentUser.role === UserRole.CUSTOMER && (
                  <CustomerAppointments currentUser={currentUser} />
                )}

                {/* Services Ticker (Simple Mobile Grid) */}
                <div className="mt-8 md:mt-16">
                   <h3 className="text-lg font-serif text-white mb-4 md:mb-6 flex items-center gap-2">
                      <span className="w-8 h-[1px] bg-gold-500"></span> Popüler Hizmetler
                   </h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      {['Saç Kesimi', 'Sakal Tasarım', 'Cilt Bakımı', 'Boya', 'Fön', 'Keratin', 'Manikür', 'Pedikür'].map((service, i) => (
                         <div key={i} className="glass-panel p-3 md:p-4 rounded-xl text-center active:bg-white/10 md:hover:bg-white/10 cursor-pointer transition-colors border-transparent md:hover:border-gold-500/20">
                            <span className="text-gray-300 font-medium text-xs md:text-sm">{service}</span>
                         </div>
                      ))}
                   </div>
                </div>
              </div>
             )
          )}

          {currentView === 'AI_CONSULT' && (
            <AIHairConsultant onClose={() => setCurrentView('DASHBOARD')} />
          )}
          
          {currentView === 'BOOKING' && currentUser && (
            <BookingWizard 
              currentUser={currentUser}
              onComplete={() => {
                alert("Randevunuz başarıyla oluşturuldu!");
                setCurrentView('DASHBOARD');
              }}
              onCancel={() => setCurrentView('DASHBOARD')}
            />
          )}
        </main>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <MobileNavBar 
            currentView={currentView} 
            setCurrentView={setCurrentView}
            currentUser={currentUser}
            onLoginClick={() => setShowCustomerLogin(true)}
            onLogoutClick={handleLogout}
        />

        {/* --- MODALS --- */}
        {showCustomerLogin && (
          <CustomerLoginModal 
            onLogin={handleLogin} 
            onClose={() => setShowCustomerLogin(false)}
            onSwitchToAdmin={() => {
              setShowCustomerLogin(false);
              setShowAdminLogin(true);
            }}
          />
        )}

        {showAdminLogin && (
          <AdminLoginModal 
            onLogin={handleLogin} 
            onClose={() => setShowAdminLogin(false)} 
            onSwitchToCustomer={() => {
              setShowAdminLogin(false);
              setShowCustomerLogin(true);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {initError && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[200] bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
          <Icon name="close" size={20} />
          <span className="text-sm">{initError}</span>
        </div>
      )}
      {showIntro ? (
        <IntroAnimation onComplete={handleIntroComplete} />
      ) : (
        renderContent()
      )}
    </>
  );
}

export default App;
