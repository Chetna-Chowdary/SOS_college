
import React from 'react';
import { 
  HeartPulse, 
  Flame, 
  ShieldAlert, 
  LifeBuoy, 
  Car, 
  MoreHorizontal 
} from 'lucide-react';
import { EmergencyType } from './types';

export const EMERGENCY_CONFIG = {
  [EmergencyType.MEDICAL]: { icon: <HeartPulse className="w-5 h-5" />, color: 'bg-green-100 text-green-700 border-green-200' },
  [EmergencyType.FIRE]: { icon: <Flame className="w-5 h-5" />, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  [EmergencyType.VIOLENCE]: { icon: <ShieldAlert className="w-5 h-5" />, color: 'bg-red-100 text-red-700 border-red-200' },
  [EmergencyType.RESCUE]: { icon: <LifeBuoy className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  [EmergencyType.ACCIDENT]: { icon: <Car className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  [EmergencyType.OTHER]: { icon: <MoreHorizontal className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export const GOOGLE_MAPS_API_KEY = 'AIzaSyA6aLRit6AseJgVJvXSZmHsRO87SlarpmA';
