
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { User } from '../types';
import { loginUser, registerCustomer } from '../services/dbService';

interface LoginModalProps {
  users?: User[]; 
  onLogin: (user: User) => void;
  onClose: () => void;
  // Navigation props
  onSwitchToAdmin?: () => void;
  onSwitchToCustomer?: () => void;
}

// --- CUSTOMER AUTH MODAL (Login / Register) ---
export const CustomerLoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose, onSwitchToAdmin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginView) {
        // Login Logic
        const user = await loginUser(phone, password);
        if (user) {
          if (user.role === 'ADMIN' || user.role === 'STAFF') {
             setError("Personel girişi için lütfen Yönetici Panelini kullanın.");
          } else {
             onLogin(user);
          }
        } else {
          setError("Telefon numarası veya şifre hatalı.");
        }
      } else {
        // Register Logic
        if (!name || !phone || !password) {
          setError("Lütfen tüm alanları doldurun.");
          setLoading(false);
          return;
        }
        const newUser = await registerCustomer(name, phone, password);
        onLogin(newUser);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <GlassCard className="w-full max-w-md relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <Icon name="close" size={24} />
        </button>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => { setIsLoginView(true); setError(null); }}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${isLoginView ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => { setIsLoginView(false); setError(null); }}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${!isLoginView ? 'text-gold-400 border-b-2 border-gold-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Kayıt Ol
          </button>
        </div>

        <div className="text-center mb-6">
          <Icon name={isLoginView ? 'user' : 'sparkles'} size={40} className="text-gold-400 mx-auto mb-2" />
          <h3 className="text-xl font-serif text-white">
            {isLoginView ? 'Tekrar Hoşgeldiniz' : 'TYRANDEVU Ailesine Katılın'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginView && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Ad Soyad</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-input p-3 rounded-xl"
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs text-gray-400 ml-1">Telefon Numarası</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full glass-input p-3 rounded-xl"
              placeholder="0555 555 55 55"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 ml-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-input p-3 rounded-xl"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-400/10 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-black transition-all mt-4
              ${loading ? 'bg-gray-600 cursor-wait' : 'bg-gold-500 hover:bg-gold-400 shadow-lg shadow-gold-500/20'}
            `}
          >
            {loading ? 'İşleniyor...' : (isLoginView ? 'Giriş Yap' : 'Hesap Oluştur')}
          </button>
        </form>

        {/* Switch to Admin */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button 
                onClick={onSwitchToAdmin}
                className="text-xs text-gray-500 hover:text-gold-400 transition-colors uppercase tracking-widest font-semibold flex items-center justify-center gap-1 mx-auto"
            >
                <Icon name="shield" size={12} />
                Personel / Yönetici Girişi
            </button>
        </div>
      </GlassCard>
    </div>
  );
};

// --- ADMIN / STAFF LOGIN MODAL ---
export const AdminLoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose, onSwitchToCustomer }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await loginUser(phone, password);
      
      if (user) {
        if (user.role === 'CUSTOMER') {
          setError("Bu panelden sadece yetkili personel giriş yapabilir.");
        } else {
          onLogin(user);
        }
      } else {
        setError("Giriş bilgileri hatalı.");
      }
    } catch (err) {
      console.error(err);
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <GlassCard className="w-full max-w-sm relative border-red-500/20 shadow-red-900/20">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <Icon name="close" size={24} />
        </button>

        <div className="text-center space-y-6 py-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <Icon name="shield" size={32} className="text-red-400" />
          </div>
          <h3 className="text-xl font-serif text-white">Yönetici & Personel Girişi</h3>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Kullanıcı No / Telefon"
              className="w-full glass-input p-3 rounded-lg border-red-500/30 focus:border-red-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full glass-input p-3 rounded-lg border-red-500/30 focus:border-red-500"
            />
            
            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-red-600/20"
            >
              {loading ? 'Kontrol Ediliyor...' : 'Giriş Yap'}
            </button>
          </form>

          {/* Switch back to Customer */}
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <button 
                onClick={onSwitchToCustomer}
                className="text-xs text-gray-500 hover:text-white transition-colors"
            >
                &larr; Müşteri Girişine Dön
            </button>
        </div>
        </div>
      </GlassCard>
    </div>
  );
};
