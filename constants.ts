import { User, UserRole, ServiceItem, Appointment } from './types';

export const APP_NAME = "TYRANDEVU";
export const OWNER_NAME = "Tarık Yalçın";

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Tarık Yalçın',
    role: UserRole.ADMIN,
    avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop',
    specialty: 'Master Stylist & Founder'
  },
  {
    id: 'u2',
    name: 'Ahmet Makas',
    role: UserRole.STAFF,
    avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&h=150&fit=crop',
    specialty: 'Fade Expert'
  },
  {
    id: 'u3',
    name: 'Mehmet Tarak',
    role: UserRole.STAFF,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop',
    specialty: 'Beard Specialist'
  },
  {
    id: 'u4',
    name: 'Müşteri Can',
    role: UserRole.CUSTOMER,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop'
  }
];

export const SERVICES: ServiceItem[] = [
  { id: 's1', name: 'Premium Saç Kesimi', price: 500, durationMin: 45, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop' },
  { id: 's2', name: 'Sakal Tasarımı & Bakım', price: 300, durationMin: 30, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop' },
  { id: 's3', name: 'Cilt Bakımı & Maske', price: 400, durationMin: 40, image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500&auto=format&fit=crop' },
  { id: 's4', name: 'TYRANDEVU Özel Paket', price: 1000, durationMin: 90, image: 'https://images.unsplash.com/photo-1503951914875-452162b7f300?w=500&auto=format&fit=crop' },
];

// Mock data to demonstrate the "Occupied" (Dolu) logic
export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    customerId: 'u4',
    customerName: 'Müşteri Can',
    staffId: 'u2', // Ahmet Makas
    staffName: 'Ahmet Makas',
    date: new Date().toISOString().split('T')[0], // Today
    time: '14:30',
    serviceId: 's1',
    serviceName: 'Premium Saç Kesimi',
    status: 'confirmed'
  },
  {
    id: 'a2',
    customerId: 'u99',
    customerName: 'Ali Veli',
    staffId: 'u2', // Ahmet Makas
    staffName: 'Ahmet Makas',
    date: new Date().toISOString().split('T')[0], // Today
    time: '15:00', // Blocks 15:00 slot
    serviceId: 's1',
    serviceName: 'Premium Saç Kesimi',
    status: 'confirmed'
  },
  {
    id: 'a3',
    customerId: 'u98',
    customerName: 'Ayşe Yılmaz',
    staffId: 'u3', // Mehmet Tarak
    staffName: 'Mehmet Tarak',
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    serviceId: 's2',
    serviceName: 'Sakal Tasarımı',
    status: 'confirmed'
  }
];
