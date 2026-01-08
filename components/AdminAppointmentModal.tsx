
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { User, Appointment, ServiceItem, UserRole } from '../types';
import { createAppointment, updateAppointmentDetails, proposeAdminChange, deleteAppointment, ensureCustomerExists } from '../services/dbService';
import { SERVICES } from '../constants';
import { getTodayString } from '../utils/dateUtils';

interface AdminAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAppointment?: Appointment | null; // If null, we are adding new
  staffMembers: User[];
}

export const AdminAppointmentModal: React.FC<AdminAppointmentModalProps> = ({ 
  isOpen, 
  onClose, 
  existingAppointment, 
  staffMembers 
}) => {
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState(''); // Only for new manual appointments
  const [serviceId, setServiceId] = useState(SERVICES[0].id);
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);

  // Init form
  useEffect(() => {
    if (isOpen) {
      if (existingAppointment) {
        setCustomerName(existingAppointment.customerName);
        setCustomerPhone(''); // We don't need phone for editing usually
        setServiceId(existingAppointment.serviceId);
        setStaffId(existingAppointment.staffId);
        setDate(existingAppointment.date);
        setTime(existingAppointment.time);
        setNotes(existingAppointment.notes || '');
      } else {
        // Reset for new
        setCustomerName('');
        setCustomerPhone('');
        setServiceId(SERVICES[0].id);
        setStaffId(staffMembers[0]?.id || '');
        setDate(getTodayString());
        setTime('12:00');
        setNotes('');
      }
    }
  }, [isOpen, existingAppointment, staffMembers]);

  const handleSaveDirectly = async () => {
    if (!customerName || !staffId || !date || !time) {
      alert("Lütfen gerekli alanları doldurun.");
      return;
    }

    // For new appointments, phone is mandatory to link/create user
    if (!existingAppointment && !customerPhone) {
        alert("Lütfen müşteri telefon numarasını giriniz.");
        return;
    }

    // Validate staffId exists in staffMembers
    const selectedStaff = staffMembers.find(s => s.id === staffId);
    if (!selectedStaff) {
      alert("Geçersiz personel seçimi. Lütfen geçerli bir personel seçin.");
      return;
    }

    setLoading(true);
    const selectedService = SERVICES.find(s => s.id === serviceId) || SERVICES[0];

    try {
      if (existingAppointment) {
        // UPDATE (No need to check user exists, we assume user ID is already linked)
        await updateAppointmentDetails(existingAppointment.id, {
          staffId,
          staffName: selectedStaff.name,
          date,
          time,
          serviceId,
          serviceName: selectedService.name,
          notes
        });
        alert("Randevu başarıyla güncellendi.");
      } else {
        // CREATE NEW
        // 1. Ensure user exists (Get existing OR Create new)
        const user = await ensureCustomerExists(customerName, customerPhone);

        // 2. Create Appointment linked to that user
        await createAppointment({
          customerId: user.id,
          customerName: user.name, // Use the name from DB to be consistent
          staffId,
          staffName: selectedStaff.name,
          date,
          time,
          serviceId,
          serviceName: selectedService.name,
          status: 'confirmed', // Admin adds as confirmed usually
          notes
        });
        alert(`Randevu oluşturuldu! Müşteri: ${user.name}`);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const handleProposeChange = async () => {
    if (!existingAppointment) return; // Can only propose on existing
    
    if(!confirm("Bu değişiklik müşterinin paneline 'Öneri' olarak gönderilecek. Onaylıyor musunuz?")) return;

    setLoading(true);
    try {
        await proposeAdminChange(existingAppointment.id, date, time);
        alert("Değişiklik önerisi müşteriye gönderildi.");
        onClose();
    } catch (e) {
        console.error(e);
        alert("Öneri gönderilemedi.");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
    if(!existingAppointment) return;
    if(!confirm("Randevuyu kalıcı olarak silmek istediğinize emin misiniz?")) return;
    
    setLoading(true);
    try {
      await deleteAppointment(existingAppointment.id);
      onClose();
    } catch(e) {
        alert("Silinemedi.");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <GlassCard className="w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <Icon name="close" size={24} />
        </button>

        <h3 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
           <Icon name={existingAppointment ? 'scissors' : 'sparkles'} className="text-gold-400" />
           {existingAppointment ? 'Randevuyu Düzenle' : 'Yeni Randevu Ekle'}
        </h3>

        <div className="space-y-4">
           {/* Customer Name */}
           <div>
              <label className="text-xs text-gray-400 ml-1">Müşteri Adı</label>
              <input 
                 value={customerName} 
                 onChange={e => setCustomerName(e.target.value)}
                 disabled={!!existingAppointment} // Don't verify name change for simplicity in edit
                 className={`w-full glass-input p-3 rounded-xl ${existingAppointment ? 'opacity-50 cursor-not-allowed' : ''}`}
                 placeholder="Ad Soyad"
              />
           </div>

           {/* Customer Phone (Only for New Appointments) */}
           {!existingAppointment && (
             <div>
                <label className="text-xs text-gray-400 ml-1">Telefon Numarası</label>
                <input 
                   type="tel"
                   value={customerPhone} 
                   onChange={e => setCustomerPhone(e.target.value)}
                   className="w-full glass-input p-3 rounded-xl"
                   placeholder="05XX XXX XX XX"
                />
                <p className="text-[10px] text-gray-500 mt-1 ml-1">*Numara kayıtlıysa eşleşir, değilse yeni müşteri oluşturulur.</p>
             </div>
           )}

           {/* Service */}
           <div>
              <label className="text-xs text-gray-400 ml-1">Hizmet</label>
              <select 
                 value={serviceId}
                 onChange={e => setServiceId(e.target.value)}
                 className="w-full glass-input p-3 rounded-xl bg-black"
              >
                 {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.durationMin} dk)</option>)}
              </select>
           </div>

           {/* Staff */}
           <div>
              <label className="text-xs text-gray-400 ml-1">Personel</label>
              <select 
                 value={staffId}
                 onChange={e => setStaffId(e.target.value)}
                 className="w-full glass-input p-3 rounded-xl bg-black"
              >
                 {staffMembers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
           </div>

           {/* Date & Time */}
           <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-xs text-gray-400 ml-1">Tarih</label>
                  <input 
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full glass-input p-3 rounded-xl"
                  />
              </div>
              <div>
                  <label className="text-xs text-gray-400 ml-1">Saat</label>
                  <input 
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full glass-input p-3 rounded-xl"
                  />
              </div>
           </div>

           {/* Notes */}
           <div>
              <label className="text-xs text-gray-400 ml-1">Notlar (Opsiyonel)</label>
              <textarea 
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
                 className="w-full glass-input p-3 rounded-xl h-20 resize-none"
                 placeholder="Örn: Cilt hassasiyeti var..."
              />
           </div>

           <div className="pt-4 flex flex-col gap-3">
              {/* Main Save Action */}
              <button 
                 onClick={handleSaveDirectly}
                 disabled={loading}
                 className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-gold-500/20 flex justify-center items-center gap-2"
              >
                 <Icon name="check" size={18} />
                 {loading ? 'İşleniyor...' : (existingAppointment ? 'Değişiklikleri Kaydet (Direkt)' : 'Randevuyu Oluştur')}
              </button>

              {/* Edit Specific Actions */}
              {existingAppointment && (
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                         onClick={handleProposeChange}
                         disabled={loading}
                         className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2"
                         title="Değişikliği müşteriye onaya gönder"
                      >
                         <Icon name="sparkles" size={16} />
                         Müşteriye Öner
                      </button>
                      <button 
                         onClick={handleDelete}
                         disabled={loading}
                         className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2"
                      >
                         <Icon name="logout" size={16} className="rotate-180" />
                         Sil
                      </button>
                  </div>
              )}
           </div>
        </div>
      </GlassCard>
    </div>
  );
};
