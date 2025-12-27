
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, update, get, child, remove } from "firebase/database";
import { SOSAlert, StudentProfile, EmergencyType, LocationData, UserRole, Complaint } from '../types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEet2KgO-Hw003GUdfjnLH_-58nnpTY8U",
  authDomain: "civicsense-ba3e7.firebaseapp.com",
  databaseURL: "https://civicsense-ba3e7-default-rtdb.firebaseio.com",
  projectId: "civicsense-ba3e7",
  storageBucket: "civicsense-ba3e7.firebasestorage.app",
  messagingSenderId: "910194054448",
  appId: "1:910194054448:web:3acb22d7ca37eedba0e4f5",
  measurementId: "G-VFJBLT6H5H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const alertsRef = ref(db, 'alerts');
const complaintsRef = ref(db, 'complaints');
const usersRef = ref(db, 'users');

let cachedAlerts: SOSAlert[] = [];
let cachedComplaints: Complaint[] = [];
const subscribers: ((alerts: SOSAlert[]) => void)[] = [];
const complaintSubscribers: ((complaints: Complaint[]) => void)[] = [];

// Real-time listener for Firebase alerts
onValue(alertsRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const alertsList: SOSAlert[] = Object.keys(data).map(key => ({
      ...data[key],
      id: key
    })).sort((a, b) => b.timestamp - a.timestamp);
    
    cachedAlerts = alertsList;
    subscribers.forEach(cb => cb([...cachedAlerts]));
  } else {
    cachedAlerts = [];
    subscribers.forEach(cb => cb([]));
  }
});

// Real-time listener for complaints
onValue(complaintsRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const list: Complaint[] = Object.keys(data).map(key => ({
      ...data[key],
      id: key
    })).sort((a, b) => b.timestamp - a.timestamp);
    cachedComplaints = list;
    complaintSubscribers.forEach(cb => cb([...cachedComplaints]));
  } else {
    cachedComplaints = [];
    complaintSubscribers.forEach(cb => cb([]));
  }
});

export const sosService = {
  subscribe: (callback: (alerts: SOSAlert[]) => void) => {
    subscribers.push(callback);
    callback([...cachedAlerts]);
    return () => {
      const index = subscribers.indexOf(callback);
      if (index > -1) subscribers.splice(index, 1);
    };
  },

  subscribeComplaints: (callback: (complaints: Complaint[]) => void) => {
    complaintSubscribers.push(callback);
    callback([...cachedComplaints]);
    return () => {
      const index = complaintSubscribers.indexOf(callback);
      if (index > -1) complaintSubscribers.splice(index, 1);
    };
  },

  seedDefaultUsers: async () => {
    const dbRef = ref(getDatabase());
    const adminEmail = "admin@klh.edu.in".replace(/\./g, ',');
    const snapshot = await get(child(dbRef, `users/${adminEmail}`));
    if (snapshot.exists()) return;

    const usersToSeed = [
      { email: "admin@klh.edu.in", data: { role: 'admin', password: 'klh@1234' } },
      { email: "2420030098@klh.edu.in", data: { role: 'student', password: 'klh@1234', profile: { name: "Rahul Sharma", rollNumber: "2420030098", branch: "CSE", year: "1st Year", phone: "+91 98765 00098" } } },
      { email: "2420030045@klh.edu.in", data: { role: 'student', password: 'klh@1234', profile: { name: "Priya Singh", rollNumber: "2420030045", branch: "CSE", year: "1st Year", phone: "+91 98765 00045" } } },
    ];
    for (const user of usersToSeed) {
      await set(ref(db, `users/${user.email.replace(/\./g, ',')}`), user.data);
    }
  },

  login: async (identifier: string, password: string) => {
    const dbRef = ref(getDatabase());
    const sanitizedEmail = identifier.replace(/\./g, ',');
    const snapshot = await get(child(dbRef, `users/${sanitizedEmail}`));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      if (userData.password === password) return { role: userData.role, profile: userData.profile };
    }
    const allUsersSnapshot = await get(child(dbRef, 'users'));
    if (allUsersSnapshot.exists()) {
      const users = allUsersSnapshot.val();
      const userFoundKey = Object.keys(users).find((key: any) => users[key].profile?.rollNumber === identifier && users[key].password === password);
      if (userFoundKey) return { role: users[userFoundKey].role, profile: users[userFoundKey].profile };
    }
    return null;
  },

  getStudents: async () => {
    const snapshot = await get(child(ref(getDatabase()), 'users'));
    return snapshot.exists() ? Object.values(snapshot.val()).filter((u: any) => u.role === 'student' && u.profile).map((u: any) => u.profile as StudentProfile) : [];
  },

  upsertStudent: async (student: StudentProfile) => {
    const dbRef = ref(getDatabase());
    const email = `${student.rollNumber}@klh.edu.in`.replace(/\./g, ',');
    
    // Check if user exists by email key
    const snapshot = await get(child(dbRef, `users/${email}`));
    
    if (snapshot.exists()) {
      // Update existing student profile
      await update(ref(db, `users/${email}/profile`), student);
    } else {
      // Add new student
      await set(ref(db, `users/${email}`), {
        role: 'student',
        password: 'klh@1234', // Default password
        profile: student
      });
    }
  },

  deleteStudent: async (rollNumber: string) => {
    const email = `${rollNumber}@klh.edu.in`.replace(/\./g, ',');
    await remove(ref(db, `users/${email}`));
  },

  registerUser: async (email: string, userData: any) => {
    await set(ref(db, `users/${email.replace(/\./g, ',')}`), userData);
  },

  triggerSOS: async (student: StudentProfile, type: EmergencyType, location: LocationData, isWitnessReport: boolean = false): Promise<SOSAlert> => {
    const newAlertRef = push(alertsRef);
    const newAlertData: Omit<SOSAlert, 'id'> = { student, type, location, timestamp: Date.now(), status: 'active', isWitnessReport };
    await set(newAlertRef, newAlertData);
    return { id: newAlertRef.key as string, ...newAlertData };
  },

  submitComplaint: async (student: StudentProfile, subject: string, description: string): Promise<void> => {
    const newComplaintRef = push(complaintsRef);
    await set(newComplaintRef, { student, subject, description, timestamp: Date.now(), status: 'pending' });
  },

  reviewComplaint: async (id: string): Promise<void> => {
    await update(ref(db, `complaints/${id}`), { status: 'reviewed' });
  },

  resolveAlert: async (id: string, report: string) => update(ref(db, `alerts/${id}`), { 
    status: 'resolved',
    resolutionReport: report,
    resolvedAt: Date.now()
  }),

  dispatchAlert: async (id: string) => update(ref(db, `alerts/${id}`), { status: 'dispatched' }),
};
