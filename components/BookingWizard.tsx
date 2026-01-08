
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { SERVICES } from '../constants';
import { ServiceItem, User, UserRole, Appointment } from '../types';
import { getUsers, subscribeToAppointments, createAppointment } from '../services/dbService';

interface BookingWizardProps {
  currentUser: User;
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'SERVICE' | 'STAFF' | 'DATETIME' | 'CONFIRM';

export const BookingWizard: React.FC<BookingWizardProps> = ({ currentUser, onComplete, onCancel }) => {
  const [step, setStep] = useState<Step>('SERVICE');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Real-time data
  const [staffList, setStaffList] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available staff
    getUsers().then(users => {
      setStaffList(users.filter(u => u.role === UserRole.STAFF || u.role === UserRole.ADMIN));
    });

    // Subscribe to all appointments for real-time availability check
    const unsubscribe = subscribeToAppointments((appts) => {
      setAppointments(appts);
    });

    return () => unsubscribe();
  }, []);

  // --- ALGORITHM: Dolu/Boş Logic (Real-time) ---
  const generateTimeSlots = () => {
    const slots = [];
    let startHour = 10;
    const endHour = 20;

    for (let h = startHour; h < endHour; h++) {
      slots.push(`${h}:00`);
      slots.push(`${h}:30`);
    }
    return slots;
  };

  const isSlotOccupied = (time: string) => {
    if (!selectedStaff || !selectedDate) return false;

    // Check against REAL Firestore data
    return appointments.some(appt => 
      appt.staffId === selectedStaff.id && 
      appt.date === selectedDate &&
      appt.time === time
    );
  };

  const handleServiceSelect = (service: ServiceItem) => {
    setSelectedService(service);
    setStep('STAFF');
  };

  const handleStaffSelect = (staff: User) => {
    setSelectedStaff(staff);
    setStep('DATETIME');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('CONFIRM');
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const newAppointment: Omit<Appointment, 'id'> = {
        customerId: currentUser.id,
        customerName: currentUser.name,
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        date: selectedDate,
        time: selectedTime,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        status: 'pending'
      };

      await createAppointment(newAppointment);
      onComplete();
    } catch (err) {
      alert("Randevu oluşturulurken bir hata oluştu.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER STEPS ---

  const renderServiceStep = () => (
    <div className="space-y-4 animate-slide-up">
      <h3 className="text-xl font-serif text-white mb-6">Hizmet Seçimi</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map(service => (
          <GlassCard 
            key={service.id} 
            onClick={() => handleServiceSelect(service)}
            className="group flex items-center gap-4 active:bg-gold-500/10 md:hover:bg-gold-500/10 border-white/10 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
              <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-white group-hover:text-gold-400 transition-colors">{service.name}</div>
              <div className="text-xs text-gray-400">{service.durationMin} Dakika</div>
            </div>
            <div className="text-gold-400 font-bold">₺{service.price}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  const renderStaffStep = () => (
    <div className="space-y-4 animate-slide-up">
      <h3 className="text-xl font-serif text-white mb-6">Personel Seçimi</h3>
      <div className="grid grid-cols-1 gap-3">
        {staffList.length === 0 ? (
          <div className="text-gray-400 text-center py-4">Personel listesi yükleniyor...</div>
        ) : (
          staffList.map(staff => (
            <GlassCard
              key={staff.id}
              onClick={() => handleStaffSelect(staff)}
              className="flex items-center gap-4 active:bg-white/10 md:hover:bg-white/10 cursor-pointer"
            >
              <img src={staff.avatar || 'https://via.placeholder.com/150'} alt={staff.name} className="w-14 h-14 rounded-full border-2 border-gold-500/50 object-cover" />
              <div className="flex-1 text-left">
                <div className="font-bold text-white">{staff.name}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">{staff.specialty || staff.role}</div>
              </div>
              <Icon name="chevronRight" className="text-gray-600" />
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );

  const renderDateTimeStep = () => {
    const timeSlots = generateTimeSlots();

    return (
      <div className="space-y-6 animate-slide-up">
        <h3 className="text-xl font-serif text-white">Tarih ve Saat</h3>
        
        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Tarih</label>
          <input 
            type="date" 
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full glass-input p-4 rounded-xl text-lg md:text-base appearance-none"
          />
        </div>

        {/* Time Grid - Mobile Optimized */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Uygun Saatler ({selectedStaff?.name})</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar pb-10">
            {timeSlots.map((time) => {
              const isOccupied = isSlotOccupied(time);
              return (
                <button
                  key={time}
                  disabled={isOccupied}
                  onClick={() => handleTimeSelect(time)}
                  className={`
                    py-3 md:py-2 rounded-lg text-base font-medium transition-all shadow-sm
                    ${isOccupied 
                      ? 'bg-red-500/10 text-red-400 cursor-not-allowed border border-red-500/20' 
                      : 'bg-white/5 text-white active:bg-gold-500 active:text-black md:hover:bg-gold-500 md:hover:text-black border border-white/10'}
                  `}
                >
                  {time}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 text-xs mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/20"></div> Boş</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"></div> Dolu</div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmStep = () => (
    <div className="space-y-6 animate-slide-up text-center">
      <div className="w-20 h-20 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon name="check" size={40} className="text-gold-400" />
      </div>
      
      <h3 className="text-2xl font-serif text-white">Randevu Özeti</h3>
      
      <div className="bg-white/5 rounded-xl p-6 space-y-4 text-left border border-white/10">
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-gray-400">Hizmet</span>
          <span className="font-medium">{selectedService?.name}</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-gray-400">Personel</span>
          <span className="font-medium">{selectedStaff?.name}</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-gray-400">Tarih</span>
          <span className="font-medium">{selectedDate}</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-gray-400">Saat</span>
          <span className="font-medium">{selectedTime}</span>
        </div>
        <div className="flex justify-between pt-2">
          <span className="text-gold-400">Toplam</span>
          <span className="text-xl font-bold text-gold-400">₺{selectedService?.price}</span>
        </div>
      </div>

      <button 
        onClick={handleConfirm}
        disabled={loading}
        className={`w-full font-bold py-4 rounded-xl transition-colors shadow-lg shadow-gold-500/20 flex justify-center items-center gap-2
          ${loading ? 'bg-gray-700 cursor-wait text-gray-300' : 'bg-gold-500 text-black active:bg-gold-600 md:hover:bg-gold-400'}
        `}
      >
        {loading ? 'İşleniyor...' : 'Randevuyu Onayla'}
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 px-4">
        {['Service', 'Staff', 'Time', 'Confirm'].map((s, idx) => {
          const stepIdx = ['SERVICE', 'STAFF', 'DATETIME', 'CONFIRM'].indexOf(step);
          return (
            <div key={s} className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${idx <= stepIdx ? 'bg-gold-500' : 'bg-gray-700'}`} />
            </div>
          );
        })}
      </div>

      <GlassCard className="relative min-h-[400px]">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-all z-10"
          title="Kapat"
        >
          <Icon name="close" size={24} />
        </button>

        {step === 'SERVICE' && renderServiceStep()}
        {step === 'STAFF' && renderStaffStep()}
        {step === 'DATETIME' && renderDateTimeStep()}
        {step === 'CONFIRM' && renderConfirmStep()}
        
        {step !== 'SERVICE' && step !== 'CONFIRM' && (
          <button 
            onClick={() => {
              if (step === 'STAFF') setStep('SERVICE');
              if (step === 'DATETIME') setStep('STAFF');
            }}
            className="mt-6 text-sm text-gray-400 hover:text-white flex items-center gap-1 p-2"
          >
            <span className="rotate-180 inline-block"><Icon name="chevronRight" size={14}/></span> Geri
          </button>
        )}
      </GlassCard>
    </div>
  );
};
