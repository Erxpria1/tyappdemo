
import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { User, UserRole, Appointment } from '../types';
import { 
  getUsers, 
  createStaffMember, 
  subscribeToAppointments, 
  approveAppointmentChange, 
  rejectAppointmentChange,
  updateAppointmentStatus,
  deleteAppointment
} from '../services/dbService';
import { AdminAppointmentModal } from './AdminAppointmentModal';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // UI State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('upcoming'); // upcoming, past, all
  const [searchTerm, setSearchTerm] = useState('');

  // Add Staff Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [newStaffSpecialty, setNewStaffSpecialty] = useState('');

  useEffect(() => {
    getUsers().then(setUsers);
    // Real-time subscription ensures admin sees changes instantly
    const unsubscribe = subscribeToAppointments(setAppointments);
    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffPhone || !newStaffPass) {
        alert("Lütfen zorunlu alanları doldurunuz.");
        return;
    }
    
    setLoading(true);
    try {
      await createStaffMember(newStaffName, newStaffPhone, newStaffPass, newStaffSpecialty || 'Stylist');
      alert("Personel başarıyla eklendi!");
      setShowAddStaff(false);
      setNewStaffName('');
      setNewStaffPhone('');
      setNewStaffPass('');
      getUsers().then(setUsers); // Refresh user list
    } catch (error: any) {
      alert(error.message || "Hata oluştu. Telefon numarası çakışması olabilir.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRequest = async (apptId: string, action: 'approve' | 'reject', reqDate?: string, reqTime?: string) => {
    if (action === 'approve') {
        if (!reqDate || !reqTime) {
            alert("Hata: Yeni tarih ve saat bilgisi eksik. Talep hatalı olabilir.");
            return;
        }
    }

    if (!confirm(action === 'approve' ? 'Değişikliği ONAYLIYOR musunuz?' : 'Değişikliği REDDEDİYOR musunuz?')) return;
    
    try {
      if (action === 'approve' && reqDate && reqTime) {
        await approveAppointmentChange(apptId, reqDate, reqTime);
      } else {
        await rejectAppointmentChange(apptId);
      }
    } catch (e) {
      console.error(e);
      alert("İşlem başarısız.");
    }
  };

  const openAddModal = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setIsModalOpen(true);
  };

  // --- FILTER & SORT LOGIC (Optimized) ---
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];
    const today = new Date().toISOString().split('T')[0];

    // 1. Text Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.customerName.toLowerCase().includes(lower) || 
        a.serviceName.toLowerCase().includes(lower) ||
        a.staffName.toLowerCase().includes(lower)
      );
    }

    // 2. Status Filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    // 3. Staff Filter
    if (filterStaff !== 'all') {
      filtered = filtered.filter(a => a.staffId === filterStaff);
    }

    // 4. Date Filter & Sorting Logic
    if (filterDate === 'upcoming') {
      filtered = filtered.filter(a => a.date >= today);
    } else if (filterDate === 'past') {
      filtered = filtered.filter(a => a.date < today);
    }
    
    return filtered;
  }, [appointments, searchTerm, filterStatus, filterStaff, filterDate]);

  // Group by Date for Display
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    filteredAppointments.forEach(appt => {
      if (!groups[appt.date]) groups[appt.date] = [];
      groups[appt.date].push(appt);
    });
    
    // Sort appointments within each group by time
    Object.keys(groups).forEach(date => {
        groups[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return groups;
  }, [filteredAppointments]);

  const sortedDateKeys = useMemo(() => {
    const keys = Object.keys(groupedAppointments);
    if (filterDate === 'past') {
        return keys.sort((a, b) => b.localeCompare(a)); 
    }
    return keys.sort((a, b) => a.localeCompare(b)); 
  }, [groupedAppointments, filterDate]);


  const staffMembers = users.filter(u => u.role === UserRole.STAFF || u.role === UserRole.ADMIN);
  const pendingChangeRequests = appointments.filter(a => a.changeRequest && a.changeRequest.status === 'pending');
  const todayAppointments = appointments.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status !== 'cancelled');

  const stats = [
    { title: 'Toplam Randevu', value: appointments.length.toString(), icon: 'calendar', change: 'Genel' },
    { title: 'Bekleyen Talepler', value: pendingChangeRequests.length.toString(), icon: 'sparkles', change: pendingChangeRequests.length > 0 ? 'İlgilenin' : 'Yok' },
    { title: 'Bugünkü Randevular', value: todayAppointments.length.toString(), icon: 'scissors', change: 'Bugün' },
  ];

  return (
    <div className="space-y-8 animate-slide-up w-full pb-20">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif text-white">Yönetim Paneli</h2>
          <p className="text-gold-400">Hoşgeldiniz, Tarık Bey</p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="text-sm text-gray-400 hidden md:block">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <button 
                onClick={openAddModal}
                className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-2 px-4 rounded-lg shadow-lg shadow-gold-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
                <Icon name="sparkles" size={18} />
                + Randevu Ekle
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <GlassCard key={index} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Icon name={stat.icon} size={60} />
            </div>
            <h3 className="text-gray-400 text-sm font-medium">{stat.title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{stat.value}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${stat.title === 'Bekleyen Talepler' && pendingChangeRequests.length > 0 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-green-400/10 text-green-400'}`}>{stat.change}</span>
            </div>
          </GlassCard>
        ))}
      </div>
      
      {/* --- CHANGE REQUESTS SECTION --- */}
      {pendingChangeRequests.length > 0 && (
        <div className="animate-fade-in border-b border-white/10 pb-8 bg-gold-500/5 p-6 rounded-2xl border border-gold-500/20 relative overflow-hidden">
           {/* Background Glow */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

           <h3 className="text-xl font-serif mb-6 flex items-center gap-3 text-gold-400">
             <div className="relative">
                 <Icon name="sparkles" className="animate-spin text-gold-500" />
                 <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
             </div>
             Talep Edilen Değişiklikler ({pendingChangeRequests.length})
           </h3>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {pendingChangeRequests.map(req => (
               <GlassCard key={req.id} className="border border-gold-500/50 shadow-[0_0_20px_rgba(212,175,55,0.1)] bg-black/40 relative overflow-hidden group">
                 {/* Decorative Glow */}
                 <div className="absolute top-0 right-0 w-20 h-20 bg-gold-500/10 blur-xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

                 <div className="relative z-10">
                     <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 font-bold text-lg">
                             {req.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <div className="font-bold text-white text-lg leading-tight">{req.customerName}</div>
                             <div className="text-xs text-gray-400 mt-1">{req.serviceName}</div>
                          </div>
                       </div>
                       <div className="text-[10px] bg-gold-500 text-black px-2 py-1 rounded font-bold uppercase tracking-wider animate-pulse">
                           Talep
                       </div>
                     </div>
                     
                     <div className="space-y-4 mb-6">
                       {/* Current Slot */}
                       <div className="relative p-3 bg-white/5 rounded-lg border border-white/5 group-hover:border-red-500/30 transition-colors">
                         <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50 rounded-l-lg"></div>
                         <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest block mb-1 pl-2">Mevcut Randevu</span>
                         <div className="text-gray-300 font-mono pl-2 flex items-center gap-2">
                            <Icon name="calendar" size={14} className="text-gray-500" />
                            {req.date} 
                            <span className="w-1 h-1 bg-gray-500 rounded-full"></span> 
                            {req.time}
                         </div>
                       </div>

                       {/* Arrow Indicator */}
                       <div className="flex justify-center -my-2 relative z-20">
                          <div className="bg-black border border-gold-500/30 rounded-full p-1 shadow-lg text-gold-500">
                             <Icon name="chevronRight" size={16} className="rotate-90" />
                          </div>
                       </div>

                       {/* New Requested Slot */}
                       <div className="relative p-3 bg-gold-500/10 rounded-lg border border-gold-500/30 group-hover:border-gold-500 transition-colors">
                         <div className="absolute top-0 left-0 w-1 h-full bg-gold-500 rounded-l-lg"></div>
                         <span className="text-[10px] uppercase text-gold-600 font-bold tracking-widest block mb-1 pl-2">İstenen Değişiklik</span>
                         <div className="text-white font-mono font-bold pl-2 flex items-center gap-2">
                            <Icon name="sparkles" size={14} className="text-gold-400" />
                            {req.changeRequest?.newDate} 
                            <span className="w-1 h-1 bg-gold-500 rounded-full"></span> 
                            {req.changeRequest?.newTime}
                         </div>
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => handleChangeRequest(req.id, 'approve', req.changeRequest?.newDate, req.changeRequest?.newTime)}
                         className="bg-green-600/90 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-all text-sm shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 active:scale-95"
                       >
                         <Icon name="check" size={16} />
                         Onayla
                       </button>
                       <button 
                         onClick={() => handleChangeRequest(req.id, 'reject')}
                         className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-medium py-3 rounded-lg transition-all text-sm border border-red-500/30 flex items-center justify-center gap-2 active:scale-95"
                       >
                         <Icon name="close" size={16} />
                         Reddet
                       </button>
                     </div>
                 </div>
               </GlassCard>
             ))}
           </div>
        </div>
      )}

      {/* --- MAIN CONTENT SPLIT --- */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT: STAFF MANAGEMENT */}
        <div className="w-full lg:w-1/3 space-y-6">
           <GlassCard>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-serif flex items-center gap-2">
                  <Icon name="user" className="text-gold-400" />
                  Personel
                </h3>
                <button 
                  onClick={() => setShowAddStaff(!showAddStaff)}
                  className="bg-gold-500/20 hover:bg-gold-500 text-gold-400 hover:text-black p-2 rounded-lg transition-colors text-xs font-bold"
                >
                  {showAddStaff ? 'İptal' : '+ Ekle'}
                </button>
              </div>

              {showAddStaff && (
                <form onSubmit={handleAddStaff} className="bg-white/5 p-4 rounded-xl mb-4 border border-gold-500/30 animate-fade-in space-y-3">
                  <div className="text-sm text-gold-400 font-bold mb-2">Yeni Personel Bilgileri</div>
                  <input placeholder="Ad Soyad" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} className="w-full glass-input p-2 rounded text-sm" required />
                  <input placeholder="Telefon (Giriş ID)" value={newStaffPhone} onChange={e => setNewStaffPhone(e.target.value)} className="w-full glass-input p-2 rounded text-sm" required />
                  <input placeholder="Şifre" value={newStaffPass} onChange={e => setNewStaffPass(e.target.value)} className="w-full glass-input p-2 rounded text-sm" required />
                  <input placeholder="Uzmanlık" value={newStaffSpecialty} onChange={e => setNewStaffSpecialty(e.target.value)} className="w-full glass-input p-2 rounded text-sm" />
                  <button type="submit" disabled={loading} className="w-full bg-gold-500 text-black font-bold py-2 rounded text-sm hover:bg-gold-400">{loading ? '...' : 'Kaydet'}</button>
                </form>
              )}

              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {staffMembers.map(staff => (
                  <div key={staff.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <img src={staff.avatar} alt={staff.name} className="w-10 h-10 rounded-full border border-gold-500/30 object-cover" />
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm flex items-center gap-2">
                        {staff.name}
                        {staff.role === UserRole.ADMIN && <Icon name="crown" size={10} className="text-gold-400" />}
                      </div>
                      <div className="text-xs text-gray-400">{staff.specialty || 'Personel'}</div>
                    </div>
                  </div>
                ))}
              </div>
           </GlassCard>
        </div>

        {/* RIGHT: ADVANCED APPOINTMENT MANAGEMENT */}
        <div className="w-full lg:w-2/3 space-y-4">
           
           {/* Filters Toolbar */}
           <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                 <Icon name="scissors" size={16} className="text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Müşteri veya Hizmet Ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-gray-500"
                 />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                 <select 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:border-gold-500 outline-none"
                 >
                    <option value="upcoming">Gelecek</option>
                    <option value="past">Geçmiş</option>
                    <option value="all">Tüm</option>
                 </select>

                 <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:border-gold-500 outline-none"
                 >
                    <option value="all">Durum</option>
                    <option value="pending">Bekleyen</option>
                    <option value="confirmed">Onaylı</option>
                 </select>
              </div>
           </div>

           {/* Appointment List (Grouped by Date & Sorted) */}
           <div className="space-y-6">
              {sortedDateKeys.length === 0 ? (
                 <div className="text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-xl">
                    Kriterlere uygun randevu bulunamadı.
                 </div>
              ) : (
                sortedDateKeys.map(dateKey => {
                   const dateObj = new Date(dateKey);
                   const isToday = dateKey === new Date().toISOString().split('T')[0];
                   const dateLabel = dateObj.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

                   return (
                      <div key={dateKey} className="animate-slide-up">
                         <div className="flex items-center gap-2 mb-3 px-2">
                            <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-gold-500 animate-pulse' : 'bg-gray-500'}`}></div>
                            <h4 className={`text-sm font-bold uppercase tracking-wider ${isToday ? 'text-white' : 'text-gray-400'}`}>
                               {isToday ? 'Bugün' : dateLabel}
                            </h4>
                            <div className="flex-1 h-[1px] bg-white/5"></div>
                         </div>
                         
                         <div className="space-y-3">
                            {groupedAppointments[dateKey].map(appt => (
                               <GlassCard 
                                 key={appt.id} 
                                 onClick={() => openEditModal(appt)}
                                 className={`p-4 hover:border-white/30 group transition-all cursor-pointer ${appt.status === 'cancelled' ? 'opacity-50 border-red-900/30' : ''}`}
                               >
                                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                     
                                     <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-lg text-center min-w-[70px] ${appt.status === 'cancelled' ? 'bg-red-900/20' : 'bg-white/5'}`}>
                                           <div className="text-lg font-bold text-white">{appt.time}</div>
                                           <div className="text-[10px] text-gray-400 uppercase">Saat</div>
                                        </div>
                                        <div>
                                           <div className="font-bold text-white text-lg flex items-center gap-2">
                                              {appt.customerName}
                                              {appt.adminProposal && appt.adminProposal.status === 'pending' && (
                                                  <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded animate-pulse">Teklif Var</span>
                                              )}
                                           </div>
                                           <div className="text-gold-400 text-sm">{appt.serviceName}</div>
                                           <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                              <Icon name="user" size={10} />
                                              {appt.staffName}
                                           </div>
                                        </div>
                                     </div>

                                     <div className="flex items-center gap-3 justify-end">
                                        <div className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wide
                                           ${appt.status === 'confirmed' ? 'bg-green-500/10 text-green-400' : 
                                             appt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                             appt.status === 'completed' ? 'bg-blue-500/10 text-blue-400' : 
                                             'bg-red-500/10 text-red-400'
                                           }
                                        `}>
                                           {appt.status === 'confirmed' ? 'Onaylı' : 
                                            appt.status === 'pending' ? 'Beklemede' : 
                                            appt.status === 'completed' ? 'Bitti' : 'İptal'}
                                        </div>
                                        
                                        <Icon name="chevronRight" size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                                     </div>

                                  </div>
                               </GlassCard>
                            ))}
                         </div>
                      </div>
                   );
                })
              )}
           </div>
        </div>
      </div>

      {/* Admin Appointment Modal */}
      <AdminAppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingAppointment={selectedAppointment}
        staffMembers={staffMembers}
      />
    </div>
  );
};
