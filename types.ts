
export enum UserRole {
  ADMIN = 'ADMIN', // Tarık Yalçın
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phoneNumber?: string; // Unique identifier for auth
  avatar?: string;
  specialty?: string; // For staff
}

export interface HairStyleRecommendation {
  name: string;
  description: string;
  faceShapeMatch: string;
  maintenanceLevel: string;
  imageUrl?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  serviceId: string;
  serviceName: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  
  // Customer requesting a change
  changeRequest?: {
    newDate: string;
    newTime: string;
    status: 'pending' | 'rejected'; // 'approved' applies the change to main date/time
    requestedAt: string;
  };

  // Admin proposing a change to the customer
  adminProposal?: {
    newDate: string;
    newTime: string;
    status: 'pending' | 'rejected';
    proposedAt: string;
  };
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  image?: string;
}
