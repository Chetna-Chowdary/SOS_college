
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  User, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  LogOut,
  AlertTriangle,
  MessageSquare,
  Send,
  Loader2,
  FileText
} from 'lucide-react';
import { EmergencyType, StudentProfile, StudentTab, Complaint } from '../types';
import { EMERGENCY_CONFIG } from '../constants';
import { sosService } from '../services/sosService';
import SOSButton from './SOSButton';

interface StudentViewProps {
  onLogout: () => void;
  profile?: StudentProfile;
}

const StudentView: React.FC<StudentViewProps> = ({ onLogout, profile }) => {
  const [currentTab, setCurrentTab] = useState<StudentTab>('home');
  const [selectedType, setSelectedType] = useState<EmergencyType>(EmergencyType.MEDICAL);
  const [isAlerting, setIsAlerting] = useState(false);
  const [isWitness, setIsWitness] = useState(false);
  const [lastAlert, setLastAlert] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'denied' | 'success'>('idle');
  
  // Complaint state
  const [complaintSub, setComplaintSub] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [studentComplaints, setStudentComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (currentTab === 'complaints') {
      const unsub = sosService.subscribeComplaints((all) => {
        setStudentComplaints(all.filter(c => c.student.rollNumber === profile?.rollNumber));
      });
      return () => unsub();
    }
  }, [currentTab, profile]);

  const student = profile || { name: 'Unknown', rollNumber: 'N/A', branch: 'N/A', year: 'N/A', phone: 'N/A' };

  const handleSOS = async () => {
    setIsAlerting(true);
    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const alert = await sosService.triggerSOS(student, selectedType, { lat: pos.coords.latitude, lng: pos.coords.longitude }, isWitness);
        setLastAlert(alert);
        setLocationStatus('success');
        setTimeout(() => setIsAlerting(false), 2000);
      },
      async () => {
        setLocationStatus('denied');
        const alert = await sosService.triggerSOS(student, selectedType, { lat: 17.3850, lng: 78.4867 }, isWitness);
        setLastAlert(alert);
        setTimeout(() => setIsAlerting(false), 2000);
      }
    );
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDesc.trim() || !complaintSub.trim()) return;
    setSubmittingComplaint(true);
    try {
      await sosService.submitComplaint(student, complaintSub, complaintDesc);
      setComplaintSub('');
      setComplaintDesc('');
      alert("Complaint submitted successfully.");
    } catch (e) {
      alert("Failed to submit complaint.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const renderHome = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Safety Command</h1>
        <p className="mt-1 text-gray-500 text-sm px-4">Instant location-based emergency dispatch.</p>
      </div>

      <div className="mt-8 flex justify-center">
        <SOSButton onTrigger={handleSOS} disabled={isAlerting} />
      </div>

      <div className="mt-8 bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isWitness ? 'bg-orange-500 text-white' : 'bg-white text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Witnessing an incident?</p>
            <p className="text-[10px] text-slate-500">Enable to report for someone else</p>
          </div>
        </div>
        <button 
          onClick={() => setIsWitness(!isWitness)}
          className={`w-12 h-6 rounded-full relative transition-all ${isWitness ? 'bg-orange-500' : 'bg-slate-200'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isWitness ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-2">Select Type</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(EmergencyType).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedType === type ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-white text-gray-600'}`}
            >
              <div className={`p-2 rounded-lg ${EMERGENCY_CONFIG[type].color}`}>{EMERGENCY_CONFIG[type].icon}</div>
              <span className="font-bold text-xs uppercase">{type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComplaints = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pt-4">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Raise a Complaint</h2>
        <p className="text-sm text-slate-500 mb-4">Report non-emergency issues like broken equipment, sanitation, or grievances.</p>
        <form onSubmit={handleComplaintSubmit} className="space-y-4">
          <input 
            placeholder="Subject (e.g. WiFi issues in Block C)" 
            className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={complaintSub}
            onChange={e => setComplaintSub(e.target.value)}
            required
          />
          <textarea 
            placeholder="Detailed description..." 
            rows={4}
            className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={complaintDesc}
            onChange={e => setComplaintDesc(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={submittingComplaint}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
          >
            {submittingComplaint ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Report</>}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">My Reports</h3>
        <div className="space-y-3">
          {studentComplaints.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs text-slate-400">No reports submitted yet.</p>
            </div>
          ) : (
            studentComplaints.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-900 text-sm">{c.subject}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${c.status === 'reviewed' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                <p className="text-[10px] text-slate-400 mt-2">{new Date(c.timestamp).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto relative shadow-2xl overflow-hidden">
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-gray-900">KLH SOS</span>
        </div>
        <button onClick={() => setCurrentTab('profile')} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-slate-600" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-28 pt-2">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'complaints' && renderComplaints()}
        {currentTab === 'profile' && (
          <div className="p-4 space-y-6">
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 text-2xl font-bold">
                {student.name[0]}
              </div>
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-slate-500 text-sm">#{student.rollNumber}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Branch</span><span className="font-bold">{student.branch}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Year</span><span className="font-bold">{student.year}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-bold">{student.phone}</span></div>
            </div>
            <button onClick={onLogout} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        )}
      </main>

      {lastAlert && !isAlerting && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 animate-in zoom-in duration-300">
           <div className={`p-6 rounded-full mb-6 ${locationStatus === 'denied' ? 'bg-orange-100' : 'bg-green-100'}`}>
              {locationStatus === 'denied' ? <AlertTriangle className="w-16 h-16 text-orange-600" /> : <CheckCircle2 className="w-16 h-16 text-green-600" />}
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">SOS ALERT SENT</h2>
           <p className="text-center text-gray-600 mb-8 px-4">Help is being dispatched to your location.</p>
           <button onClick={() => setLastAlert(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">Return</button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-10 py-5 flex justify-between items-center max-w-md mx-auto z-40">
        <button onClick={() => setCurrentTab('home')} className={`flex flex-col items-center ${currentTab === 'home' ? 'text-indigo-600' : 'text-gray-400'}`}>
          <Home className="w-6 h-6" /><span className="text-[10px] mt-1 font-bold">HOME</span>
        </button>
        <button onClick={() => setCurrentTab('complaints')} className={`flex flex-col items-center ${currentTab === 'complaints' ? 'text-indigo-600' : 'text-gray-400'}`}>
          <MessageSquare className="w-6 h-6" /><span className="text-[10px] mt-1 font-bold">REPORTS</span>
        </button>
        <button onClick={() => setCurrentTab('profile')} className={`flex flex-col items-center ${currentTab === 'profile' ? 'text-indigo-600' : 'text-gray-400'}`}>
          <User className="w-6 h-6" /><span className="text-[10px] mt-1 font-bold">PROFILE</span>
        </button>
      </nav>
    </div>
  );
};

export default StudentView;
