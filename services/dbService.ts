
import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, query, where, Timestamp, onSnapshot, limit, updateDoc, doc, deleteDoc, deleteField } from "firebase/firestore";
import { User, Appointment, UserRole } from "../types";
import { MOCK_USERS } from "../constants";

const USERS_COLLECTION = "users";
const APPOINTMENTS_COLLECTION = "appointments";

// Check if we're in test environment
const isTestEnvironment = () => {
  return (window as any).__PLAYWRIGHT__ === true;
};

// Helper to check if Firebase is available
// In test mode, always return false to force mock usage
const isDbAvailable = () => {
  if (isTestEnvironment()) return false;
  return db !== null && typeof db === 'object';
};

// ========== IN-MOCK DATA FOR TESTS ==========
// Use localStorage to persist mock data across page reloads in tests
const getMockUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('__mockUsers__');
  if (stored) return JSON.parse(stored);

  // Initialize with default users if not exists
  const defaults: User[] = [
    {
      id: 'admin-1',
      name: 'Tarık Yalçın',
      phoneNumber: '5555555555',
      password: 'admin',
      role: UserRole.ADMIN,
      specialty: 'Master Stylist',
      avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop'
    },
    {
      id: 'staff-1',
      name: 'Ahmet Makas',
      phoneNumber: '5111111111',
      password: '123456',
      role: UserRole.STAFF,
      specialty: 'Barber',
      avatar: 'https://ui-avatars.com/api/?name=Ahmet+Makas&background=333&color=fff'
    },
    {
      id: 'staff-2',
      name: 'Mehmet Bıçak',
      phoneNumber: '5222222222',
      password: '123456',
      role: UserRole.STAFF,
      specialty: 'Stylist',
      avatar: 'https://ui-avatars.com/api/?name=Mehmet+Bicak&background=333&color=fff'
    }
  ];
  localStorage.setItem('__mockUsers__', JSON.stringify(defaults));
  return defaults;
};

const saveMockUsers = (users: User[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('__mockUsers__', JSON.stringify(users));
  }
};

const getMockAppointments = (): Appointment[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('__mockAppointments__');
  return stored ? JSON.parse(stored) : [];
};

const saveMockAppointments = (appts: Appointment[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('__mockAppointments__', JSON.stringify(appts));
  }
};

// Get current mock users (will be initialized from localStorage or defaults)
let mockUsers: User[] = getMockUsers();
let mockAppointments: Appointment[] = getMockAppointments();

// ========== MOCK FUNCTIONS ==========
const mockCheckUserExists = async (phoneNumber: string): Promise<boolean> => {
  // Refresh from localStorage to get latest data
  mockUsers = getMockUsers();
  return mockUsers.some(u => u.phoneNumber === phoneNumber);
};

const mockLoginUser = async (phoneNumber: string, password: string): Promise<User | null> => {
  // Refresh from localStorage to get latest data
  mockUsers = getMockUsers();
  const user = mockUsers.find(u => u.phoneNumber === phoneNumber && u.password === password);
  return user || null;
};

const mockRegisterCustomer = async (name: string, phoneNumber: string, password: string): Promise<User> => {
  // Refresh from localStorage to get latest data
  mockUsers = getMockUsers();
  const exists = await mockCheckUserExists(phoneNumber);
  if (exists) {
    throw new Error("Bu telefon numarası zaten kayıtlı.");
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    phoneNumber,
    password,
    role: UserRole.CUSTOMER,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D4AF37&color=000`
  };

  mockUsers.push(newUser);
  saveMockUsers(mockUsers);
  return newUser;
};

const mockGetUsers = async (): Promise<User[]> => {
  // Refresh from localStorage to get latest data
  mockUsers = getMockUsers();
  console.log('[MOCK] mockGetUsers called, returning users:', mockUsers.map(u => ({ id: u.id, name: u.name, role: u.role })));
  return mockUsers.map(u => {
    const { password, ...rest } = u as any;
    return rest;
  });
};

const mockCreateStaffMember = async (name: string, phoneNumber: string, password: string, specialty: string): Promise<void> => {
  const exists = await mockCheckUserExists(phoneNumber);
  if (exists) {
    throw new Error("Bu telefon numarası zaten sistemde kayıtlı.");
  }

  const newStaff: User = {
    id: `staff-${Date.now()}`,
    name,
    phoneNumber,
    password,
    role: UserRole.STAFF,
    specialty,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=333&color=fff`
  };

  mockUsers.push(newStaff);
};

const mockGetAppointments = async (): Promise<Appointment[]> => {
  // Refresh from localStorage to get latest data
  mockAppointments = getMockAppointments();
  return mockAppointments;
};

const mockSubscribeToAppointments = (callback: (appts: Appointment[]) => void) => {
  // Return unsubscribe function
  return () => {};
};

// ========== REAL FIREBASE FUNCTIONS ==========
const realCheckUserExists = async (phoneNumber: string): Promise<boolean> => {
  const q = query(collection(db, USERS_COLLECTION), where("phoneNumber", "==", phoneNumber));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// Check if a phone number already exists
export const checkUserExists = async (phoneNumber: string): Promise<boolean> => {
  if (isTestEnvironment() || !isDbAvailable()) {
    return mockCheckUserExists(phoneNumber);
  }
  const q = query(collection(db, USERS_COLLECTION), where("phoneNumber", "==", phoneNumber));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// Login Function (Phone + Password)
export const loginUser = async (phoneNumber: string, password: string): Promise<User | null> => {
  if (isTestEnvironment() || !isDbAvailable()) {
    return mockLoginUser(phoneNumber, password);
  }
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("phoneNumber", "==", phoneNumber),
      where("password", "==", password),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      name: data.name,
      role: data.role,
      phoneNumber: data.phoneNumber,
      avatar: data.avatar,
      specialty: data.specialty
    } as User;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Register Customer
export const registerCustomer = async (name: string, phoneNumber: string, password: string): Promise<User> => {
  if (isTestEnvironment() || !isDbAvailable()) {
    return mockRegisterCustomer(name, phoneNumber, password);
  }
  const exists = await checkUserExists(phoneNumber);
  if (exists) {
    throw new Error("Bu telefon numarası zaten kayıtlı.");
  }

  const newUser = {
    name,
    phoneNumber,
    password,
    role: UserRole.CUSTOMER,
    avatar: `https://ui-avatars.com/api/?name=${name}&background=D4AF37&color=000`,
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, USERS_COLLECTION), newUser);

  return {
    id: docRef.id,
    name: newUser.name,
    role: newUser.role,
    phoneNumber: newUser.phoneNumber,
    avatar: newUser.avatar
  };
};

/**
 * ADMIN HELPER:
 * Checks if a user exists by phone.
 * - If YES: Returns that user.
 * - If NO: Creates a new user with default password '123456'.
 */
export const ensureCustomerExists = async (name: string, phone: string): Promise<User> => {
  // 1. Check existing
  const q = query(collection(db, USERS_COLLECTION), where("phoneNumber", "==", phone), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    // Return existing user
    return {
      id: doc.id,
      name: data.name, // Use database name or update it? Keeping DB name is safer for consistency.
      role: data.role,
      phoneNumber: data.phoneNumber,
      avatar: data.avatar
    } as User;
  }

  // 2. Create new
  console.log("User not found, creating new customer:", name);
  return await registerCustomer(name, phone, "123456");
};

// Admin creating Staff
export const createStaffMember = async (name: string, phoneNumber: string, password: string, specialty: string): Promise<void> => {
  if (isTestEnvironment() || !isDbAvailable()) {
    return mockCreateStaffMember(name, phoneNumber, password, specialty);
  }
  const exists = await checkUserExists(phoneNumber);
  if (exists) {
    throw new Error("Bu telefon numarası zaten sistemde kayıtlı.");
  }

  const newStaff = {
    name,
    phoneNumber,
    password,
    role: UserRole.STAFF,
    specialty,
    avatar: `https://ui-avatars.com/api/?name=${name}&background=333&color=fff`,
    createdAt: new Date().toISOString()
  };

  await addDoc(collection(db, USERS_COLLECTION), newStaff);
};

// Get all users (mostly for staff listing)
export const getUsers = async (): Promise<User[]> => {
  if (isTestEnvironment() || !isDbAvailable()) {
    return mockGetUsers();
  }
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const { password, ...userData } = doc.data();
      users.push({ id: doc.id, ...userData } as User);
    });
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Updated: Checks specifically for the admin phone number, creates it if missing
export const seedUsersIfEmpty = async () => {
  if (isTestEnvironment() || !isDbAvailable()) {
    // Mock already has admin, just return false
    return false;
  }
  const ADMIN_PHONE = "5555555555";
  const exists = await checkUserExists(ADMIN_PHONE);

  if (!exists) {
    console.log("Admin account missing. Creating...");
    await addDoc(collection(db, USERS_COLLECTION), {
      name: "Tarık Yalçın",
      phoneNumber: ADMIN_PHONE,
      password: "admin",
      role: UserRole.ADMIN,
      specialty: "Master Stylist",
      avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop"
    });
    return true; // Changes made
  }
  return false; // No changes
};

// --- APPOINTMENTS ---

export const getAppointments = async (): Promise<Appointment[]> => {
  if (isTestEnvironment() || !isDbAvailable()) {
    return mockGetAppointments();
  }
  try {
    const q = query(collection(db, APPOINTMENTS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() } as Appointment);
    });
    return appointments;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
};

export const getCustomerAppointments = async (customerId: string): Promise<Appointment[]> => {
  try {
    const q = query(collection(db, APPOINTMENTS_COLLECTION), where("customerId", "==", customerId));
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() } as Appointment);
    });
    return appointments;
  } catch (error) {
    console.error("Error fetching customer appointments:", error);
    return [];
  }
};

export const createAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<string> => {
  if (isTestEnvironment() || !isDbAvailable()) {
    // Mock: Save to localStorage
    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      ...appointment
    };
    mockAppointments.push(newAppointment);
    saveMockAppointments(mockAppointments);
    console.log('[MOCK] Created appointment:', newAppointment);
    return newAppointment.id;
  }
  try {
    const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), appointment);
    return docRef.id;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

// Direct Admin Update (Force Edit)
export const updateAppointmentDetails = async (id: string, updates: Partial<Appointment>) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, id);
  // Remove id from updates if it exists to avoid overwriting doc ID in data (bad practice)
  const { id: _, ...safeUpdates } = updates as any;
  await updateDoc(apptRef, safeUpdates);
};

export const subscribeToAppointments = (callback: (appts: Appointment[]) => void) => {
  if (isTestEnvironment() || !isDbAvailable()) {
    // In test mode, refresh from localStorage and call with mock data
    mockAppointments = getMockAppointments();
    callback(mockAppointments);
    return () => {};
  }
  const q = query(collection(db, APPOINTMENTS_COLLECTION));
  return onSnapshot(q, (querySnapshot) => {
    const appointments: Appointment[] = [];
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() } as Appointment);
    });
    callback(appointments);
  });
};

// --- APPOINTMENT ACTIONS (ADMIN & CUSTOMER) ---

export const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(apptRef, { status });
};

// Customer cancels their own appointment
export const cancelAppointment = async (appointmentId: string) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(apptRef, { status: 'cancelled' });
};

export const deleteAppointment = async (appointmentId: string) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await deleteDoc(apptRef);
};

// --- CHANGE REQUESTS (Customer requesting change) ---

export const requestAppointmentChange = async (appointmentId: string, newDate: string, newTime: string) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(apptRef, {
    changeRequest: {
      newDate,
      newTime,
      status: 'pending',
      requestedAt: new Date().toISOString()
    }
  });
};

export const withdrawAppointmentChangeRequest = async (appointmentId: string) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(apptRef, {
    changeRequest: deleteField() // Correctly removes the field
  });
};

export const approveAppointmentChange = async (appointmentId: string, newDate: string, newTime: string) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  // Apply the change and remove the request object
  await updateDoc(apptRef, {
    date: newDate,
    time: newTime,
    changeRequest: deleteField(), // Clear request completely
    status: 'confirmed' // Re-confirm if it was pending
  });
};

export const rejectAppointmentChange = async (appointmentId: string) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(apptRef, {
    "changeRequest.status": 'rejected'
  });
};

// --- ADMIN PROPOSALS (Admin sending change to Customer) ---

export const proposeAdminChange = async (appointmentId: string, newDate: string, newTime: string) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(apptRef, {
    adminProposal: {
      newDate,
      newTime,
      status: 'pending',
      proposedAt: new Date().toISOString()
    }
  });
};

export const acceptAdminProposal = async (appointmentId: string, newDate: string, newTime: string) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(apptRef, {
    date: newDate,
    time: newTime,
    adminProposal: deleteField(),
    status: 'confirmed'
  });
};

export const rejectAdminProposal = async (appointmentId: string) => {
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(apptRef, {
    "adminProposal.status": 'rejected'
  });
};
