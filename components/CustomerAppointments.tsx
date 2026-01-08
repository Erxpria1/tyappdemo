
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { Appointment, User } from '../types';
import {
  subscribeToAppointments,
  requestAppointmentChange,
  withdrawAppointmentChangeRequest,
  cancelAppointment,
  acceptAdminProposal,
  rejectAdminProposal
} from '../services/dbService';
import { getTodayString } from '../utils/dateUtils';
import { StatusBadge } from './StatusBadge';

interface CustomerAppointmentsProps {
  currentUser: User;
}

export const CustomerAppointments: React.FC<CustomerAppointmentsProps> = ({ currentUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit Form State
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates to see admin approval instantly
    const unsubscribe = subscribeToAppointments((allAppts) => {
      const myAppts = allAppts.filter(a => a.customerId === currentUser.id);
      // Sort by date (newest first)
      myAppts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAppointments(myAppts);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  const handleEditClick = (e: React.MouseEvent, appt: Appointment) => {
    e.stopPropagation();
    setEditingId(appt.id);
    setNewDate(appt.date);
    setNewTime(appt.time);
  };

  const submitChangeRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingId || !newDate || !newTime) return;
    setLoading(true);
    try {
      await requestAppointmentChange(editingId, newDate, newTime);
      alert("Değişiklik talebiniz iletildi. Admin onayı bekleniyor.");
      setEditingId(null);
    } catch (error) {
      console.error(error);
      alert("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm("Değişiklik talebini iptal etmek istediğinize emin misiniz?")) return;
    try {
      await withdrawAppointmentChangeRequest(id);
    } catch(e) {
      console.error(e);
      alert("İşlem başarısız");
    }
  };

  const handleCancelAppointment = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm("Randevuyu tamamen İPTAL etmek üzeresiniz. Onaylıyor musunuz?")) return;
    try {
      await cancelAppointment(id);
    } catch(e) {
      console.error(e);
      alert("İptal işlemi başarısız");
    }
  };

  const handleProposalResponse = async (e: React.MouseEvent, id: string, accept: boolean, proposal?: any) => {
    e.stopPropagation();
    if(!proposal) return;
    setLoading(true);
    try {
        if(accept) {
            await acceptAdminProposal(id, proposal.newDate, proposal.newTime);
            alert("Yeni randevu saati onaylandı!");
        } else {
            await rejectAdminProposal(id);
        }
    } catch(e) {
        console.error(e);
        alert("İşlem başarısız.");
    } finally {
        setLoading(false);
    }
  };

  if (appointments.length === 0) return null;

  return (
    <div className="animate-slide-up mt-8">
       <h3 className="text-xl font-serif text-white mb-4 flex items-center gap-2">
         <Icon name="calendar" className="text-gold-400" />
         Randevularım
       </h3>
       
       <div className="space-y-4">
         {appointments.map(appt => (
           <GlassCard key={appt.id} className={`relative border-l-4 ${appt.status === 'cancelled' ? 'border-l-red-500 opacity-60' : 'border-l-gold-500'}`}>
             
             {/* ADMIN PROPOSAL BANNER */}
             {appt.adminProposal && appt.adminProposal.status === 'pending' && (
                <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 animate-pulse">
                   <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-2">
                       <Icon name="sparkles" size={16} />
                       Salon Önerisi (Değişiklik Teklifi)
                   </div>
                   <div className="text-gray-300 text-xs mb-3">
                       Salonumuz randevu saatiniz için bir değişiklik öneriyor:
                   </div>
                   <div className="flex items-center justify-between bg-black/40 p-2 rounded mb-3">
                       <div className="text-gray-500 line-through text-xs">{appt.date} {appt.time}</div>
                       <Icon name="chevronRight" size={12} className="text-blue-500" />
                       <div className="text-white font-bold text-sm">{appt.adminProposal.newDate} {appt.adminProposal.newTime}</div>
                   </div>
                   <div className="flex gap-2">
                       <button 
                         onClick={(e) => handleProposalResponse(e, appt.id, true, appt.adminProposal)}
                         disabled={loading}
                         className="flex-1 bg-blue-500 text-white text-xs font-bold py-2 rounded hover:bg-blue-400"
                       >
                         Kabul Et
                       </button>
                       <button 
                         onClick={(e) => handleProposalResponse(e, appt.id, false, appt.adminProposal)}
                         disabled={loading}
                         className="flex-1 bg-white/10 text-white text-xs font-bold py-2 rounded hover:bg-white/20"
                       >
                         Reddet
                       </button>
                   </div>
                </div>
             )}

             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               
               {/* Info Section */}
               <div className="space-y-1">
                 <div className="font-bold text-lg text-white flex items-center gap-2">
                    {appt.serviceName}
                    {appt.status === 'cancelled' && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">İPTAL EDİLDİ</span>}
                 </div>
                 <div className="text-gray-300 flex items-center gap-2">
                   <Icon name="user" size={14} /> 
                   {appt.staffName}
                 </div>
                 <div className="text-gold-400 font-mono text-sm flex items-center gap-2">
                   <Icon name="calendar" size={14} />
                   {appt.date} <span className="text-white/50">|</span> {appt.time}
                 </div>
                 
                 {/* Status Badges */}
                 <div className="flex gap-2 mt-2">
                    {appt.status !== 'cancelled' && (
                      <StatusBadge status={appt.status} />
                    )}

                    {appt.changeRequest && appt.changeRequest.status === 'pending' && (
                        <span className="text-xs px-2 py-1 rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-400 flex items-center gap-1 animate-pulse">
                            <Icon name="sparkles" size={10} /> Değişiklik Bekleniyor
                        </span>
                    )}

                    {appt.changeRequest && appt.changeRequest.status === 'rejected' && (
                        <span className="text-xs px-2 py-1 rounded-full border border-red-500/50 bg-red-500/10 text-red-400">
                            Değişiklik Reddedildi
                        </span>
                    )}
                 </div>
               </div>

               {/* Action Section */}
               <div className="w-full md:w-auto">
                 {appt.status !== 'cancelled' && (
                    <>
                         {editingId === appt.id ? (
                        <div className="bg-white/10 p-4 rounded-lg space-y-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <div className="text-sm text-gold-400 font-bold mb-1">Yeni Tarih & Saat Seçin</div>
                            <input 
                                type="date" 
                                value={newDate}
                                min={getTodayString()}
                                onChange={e => setNewDate(e.target.value)}
                                className="w-full glass-input p-2 rounded text-sm"
                            />
                            <select 
                                value={newTime}
                                onChange={e => setNewTime(e.target.value)}
                                className="w-full glass-input p-2 rounded text-sm"
                            >
                                <option value="" className="bg-slate-900">Saat Seçin</option>
                                {Array.from({length: 20}, (_, i) => {
                                    const h = Math.floor(i/2) + 10;
                                    const m = i % 2 === 0 ? '00' : '30';
                                    return `${h}:${m}`;
                                }).map(t => (
                                    <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                                ))}
                            </select>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={submitChangeRequest}
                                    disabled={loading}
                                    className="flex-1 bg-gold-500 text-black text-xs font-bold py-2 rounded hover:bg-gold-400"
                                >
                                    {loading ? '...' : 'Gönder'}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                    className="flex-1 bg-white/10 text-white text-xs font-bold py-2 rounded hover:bg-white/20"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {/* If there is a pending request, show Withdraw button. Else show Edit Button */}
                                {appt.changeRequest && appt.changeRequest.status === 'pending' ? (
                                    <button 
                                        onClick={(e) => handleWithdrawRequest(e, appt.id)}
                                        className="w-full px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all text-xs font-bold flex items-center justify-center gap-1"
                                    >
                                        <Icon name="close" size={12} /> Talebi Geri Çek
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => handleEditClick(e, appt)}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 hover:border-gold-500 hover:text-gold-400 text-gray-300 rounded-lg transition-all text-xs font-bold"
                                    >
                                        Değişiklik Talep Et
                                    </button>
                                )}
                                
                                <button 
                                    onClick={(e) => handleCancelAppointment(e, appt.id)}
                                    className="w-full px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-all text-xs font-bold"
                                >
                                    Randevuyu İptal Et
                                </button>
                            </div>
                        )}
                    </>
                 )}
               </div>
             </div>
           </GlassCard>
         ))}
       </div>
    </div>
  );
};
