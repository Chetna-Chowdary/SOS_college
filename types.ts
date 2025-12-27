
export enum EmergencyType {
  MEDICAL = 'Medical',
  FIRE = 'Fire',
  VIOLENCE = 'Violence',
  RESCUE = 'Rescue',
  ACCIDENT = 'Accident',
  OTHER = 'Other'
}

export interface StudentProfile {
  name: string;
  rollNumber: string;
  branch: string;
  year: string;
  phone: string;
}

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isEmergency: boolean;
}

export interface LocationData {
  lat: number;
  lng: number;
}

export interface SOSAlert {
  id: string;
  student: StudentProfile;
  type: EmergencyType;
  location: LocationData;
  timestamp: number;
  status: 'active' | 'resolved' | 'dispatched';
  isWitnessReport?: boolean;
  resolutionReport?: string; // New: Admin feedback after incident
  resolvedAt?: number; // New: Timestamp of resolution
}

export interface Complaint {
  id: string;
  student: StudentProfile;
  subject: string;
  description: string;
  timestamp: number;
  status: 'pending' | 'reviewed';
}

export type UserRole = 'student' | 'admin';
export type StudentTab = 'home' | 'circle' | 'complaints' | 'profile';

export interface AuthState {
  isLoggedIn: boolean;
  role: UserRole | null;
  email: string | null;
  profile?: StudentProfile;
}
