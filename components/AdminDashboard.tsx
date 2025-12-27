
import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle, 
  User, 
  Navigation, 
  Search,
  LayoutDashboard,
  Shield,
  Activity,
  LogOut,
  ExternalLink,
  MessageSquare,
  FileText,
  Eye,
  Users,
  X,
  ChevronRight,
  Info,
  Calendar,
  MoreVertical,
  Filter,
  Download,
  AlertTriangle,
  Send,
  UserPlus,
  Pencil,
  Trash2,
  Save,
  Check
} from 'lucide-react';
import { sosService } from '../services/sosService';
import { SOSAlert, StudentProfile, EmergencyType, Complaint } from '../types';
import { EMERGENCY_CONFIG } from '../constants';

declare var google: any;

type AdminView = 'dashboard' | 'reports' | 'registry' | 'complaints';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Resolution Modal State
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [resolutionReport, setResolutionReport] = useState('');
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);

  // Archive Detail State
  const [viewingArchiveAlert, setViewingArchiveAlert] = useState<SOSAlert | null>(null);

  // Student Editor State
  const [isStudentEditorOpen, setIsStudentEditorOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [studentFormData, setStudentFormData] = useState<StudentProfile>({
    name: '',
    rollNumber: '',
    branch: '',
    year: '',
    phone: ''
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const marker = useRef<any>(null);

  const fetchStudents = async () => {
    const data = await sosService.getStudents();
    setStudents(data);
  };

  useEffect(() => {
    const unsubAlerts = sosService.subscribe(setAlerts);
    const unsubComplaints = sosService.subscribeComplaints(setComplaints);
    fetchStudents();

    return () => {
      unsubAlerts();
      unsubComplaints();
    };
  }, []);

  const pendingComplaintsCount = complaints.filter(c => c.status === 'pending').length;
  const activeAlertsCount = alerts.filter(a => a.status !== 'resolved').length;

  const initMap = (lat: number, lng: number) => {
    if (!mapRef.current || !(window as any).google) return;
    googleMap.current = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 17,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
    });
    marker.current = new google.maps.Marker({
      position: { lat, lng },
      map: googleMap.current,
      animation: google.maps.Animation.DROP,
    });
  };

  useEffect(() => {
    if (activeView === 'dashboard' && selectedAlert) {
      const pos = { lat: selectedAlert.location.lat, lng: selectedAlert.location.lng };
      const timer = setTimeout(() => {
        if (!googleMap.current && (window as any).google) {
          initMap(pos.lat, pos.lng);
        } else if (googleMap.current) {
          googleMap.current.setCenter(pos);
          marker.current?.setPosition(pos);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedAlert, activeView]);

  const handleResolveTrigger = (id: string) => {
    setResolvingAlertId(id);
    setResolutionReport('');
    setIsResolutionModalOpen(true);
  };

  const handleConfirmResolution = async () => {
    if (!resolvingAlertId || !resolutionReport.trim()) return;
    await sosService.resolveAlert(resolvingAlertId, resolutionReport);
    setIsResolutionModalOpen(false);
    setSelectedAlert(null);
    setResolvingAlertId(null);
    setResolutionReport('');
  };

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentFormData({ name: '', rollNumber: '', branch: '', year: '', phone: '' });
    setIsStudentEditorOpen(true);
  };

  const handleOpenEditStudent = (student: StudentProfile) => {
    setEditingStudent(student);
    setStudentFormData({ ...student });
    setIsStudentEditorOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    await sosService.upsertStudent(studentFormData);
    setIsStudentEditorOpen(false);
    fetchStudents();
  };

  const handleDeleteStudent = async (rollNumber: string) => {
    if (window.confirm(`Are you sure you want to remove student with Roll No: ${rollNumber}?`)) {
      await sosService.deleteStudent(rollNumber);
      fetchStudents();
    }
  };

  const renderDashboard = () => (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-80 border-r border-slate-200 bg-white overflow-y-auto shrink-0">
        <div className="divide-y divide-slate-100">
          {alerts.filter(a => a.status !== 'resolved').length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No pending incidents</p>
            </div>
          ) : (
            alerts.filter(a => a.status !== 'resolved').map(alert => (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`w-full p-5 text-left transition-all hover:bg-slate-50 relative ${selectedAlert?.id === alert.id ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-500 z-10' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${EMERGENCY_CONFIG[alert.type].color}`}>{alert.type}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 truncate">{alert.student.name}</h3>
                <p className="text-xs text-slate-500 mb-3 truncate">{alert.student.branch} • {alert.student.year}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  <div className={`w-2 h-2 rounded-full ${alert.status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                  {alert.status}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-slate-50 p-6 overflow-y-auto">
        {selectedAlert ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Student Identity</h4>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl">{selectedAlert.student.name[0]}</div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 truncate text-lg">{selectedAlert.student.name}</p>
                    <p className="text-xs text-slate-500 font-mono">ROLL: {selectedAlert.student.rollNumber}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <a href={`tel:${selectedAlert.student.phone}`} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                    <Phone className="w-4 h-4" /> CONTACT STUDENT
                  </a>
                  <button onClick={() => window.open(`https://www.google.com/maps?q=${selectedAlert.location.lat},${selectedAlert.location.lng}`)} className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all uppercase">
                    <ExternalLink className="w-4 h-4" /> View in Google Maps
                  </button>
                </div>
              </div>
              <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Crisis Protocol</h4>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <button onClick={() => sosService.dispatchAlert(selectedAlert.id)} className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all group ${selectedAlert.status === 'dispatched' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'}`}>
                    <Navigation className={`w-8 h-8 ${selectedAlert.status === 'dispatched' ? 'animate-pulse' : 'group-hover:translate-y-[-2px] transition-transform'}`} />
                    <span className="font-bold">Dispatch Unit</span>
                    <span className="text-[10px] opacity-70">Mark team as en route</span>
                  </button>
                  <button onClick={() => handleResolveTrigger(selectedAlert.id)} className="flex flex-col items-center justify-center gap-2 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all group">
                    <CheckCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">Resolve SOS</span>
                    <span className="text-[10px] opacity-70">Secured & Logged</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="h-[450px] bg-white rounded-3xl border border-slate-200 overflow-hidden relative shadow-xl">
              <div ref={mapRef} className="w-full h-full" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border border-white flex items-center gap-3 z-10">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Active Tracking Stream</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <div className="w-24 h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <LayoutDashboard className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Select a pending incident from the feed</h3>
            <p className="text-slate-400 mt-2 text-sm">Real-time GPS coordinates will populate upon selection.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderIncidentReports = () => {
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
    return (
      <div className="flex-1 flex flex-col bg-slate-50 p-8 overflow-y-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Incident Archive</h2>
            <p className="text-slate-500 text-sm mt-1">Full history of resolved campus SOS alerts.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"><Filter className="w-4 h-4" /> Filter By Date</button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-200 hover:bg-slate-800"><Download className="w-4 h-4" /> Export CSV</button>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolved Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Report</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resolvedAlerts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">Archive is currently empty</td></tr>
              ) : (
                resolvedAlerts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-slate-900">{a.student.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{a.student.rollNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${EMERGENCY_CONFIG[a.type].color}`}>{a.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 font-medium">{new Date(a.resolvedAt || a.timestamp).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(a.resolvedAt || a.timestamp).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs text-slate-500 truncate">{a.resolutionReport || "No report logged"}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => setViewingArchiveAlert(a)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                         <Info className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStudentRegistry = () => (
    <div className="flex-1 flex flex-col bg-slate-50 p-8 overflow-y-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Registry</h2>
          <p className="text-slate-500 text-sm mt-1">Manage authorized campus members and security profiles.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Search registry..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenAddStudent}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest"
          >
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.filter(s => s.rollNumber.includes(searchQuery) || s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(student => (
          <div key={student.rollNumber} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center font-bold text-indigo-600 text-lg shadow-inner">{student.name[0]}</div>
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{student.name}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEditStudent(student)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteStudent(student.rollNumber)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mb-2 uppercase">ID: {student.rollNumber}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="bg-slate-50 text-slate-500 border border-slate-100 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{student.branch}</span>
                <span className="bg-slate-50 text-slate-500 border border-slate-100 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{student.year}</span>
              </div>
              <a href={`tel:${student.phone}`} className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"><Phone className="w-3 h-3" /> {student.phone}</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComplaints = () => (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
      <div className="p-8 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Reports</h2>
            <p className="text-slate-500 text-sm mt-1">Grievances and non-emergency feedback requiring administrative review.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">
              {pendingComplaintsCount} Pending Action
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporter</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Received</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">No reports submitted yet</td></tr>
              ) : (
                complaints.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 font-bold text-[10px]">{c.student.name[0]}</div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{c.student.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{c.student.rollNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700 text-sm truncate max-w-[200px]">{c.subject}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[250px]">{c.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 font-medium">{new Date(c.timestamp).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedComplaint(c)}
                        className={`p-2 rounded-lg transition-all ${c.status === 'reviewed' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                      >
                        {c.status === 'reviewed' ? <CheckCircle className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedComplaint && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedComplaint(null)} />
          <div className="w-[480px] h-full bg-white shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Incident Dossier</h3>
                <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-10">
                <section>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Reporter Information</label>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl font-black text-indigo-600 border border-slate-100">{selectedComplaint.student.name[0]}</div>
                    <div className="overflow-hidden">
                      <p className="font-black text-slate-900 text-xl tracking-tight truncate">{selectedComplaint.student.name}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase">{selectedComplaint.student.branch} • {selectedComplaint.student.year}</p>
                      <div className="mt-2 text-[11px] font-mono text-slate-400">ID: {selectedComplaint.student.rollNumber}</div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Grievance Narrative</label>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-2xl leading-tight tracking-tight">{selectedComplaint.subject}</h4>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-2 uppercase">
                      <Calendar className="w-3 h-3" /> Logged on {new Date(selectedComplaint.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white border-l-4 border-indigo-200 pl-6 py-2">
                    <p className="text-slate-600 leading-relaxed font-medium text-sm whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>
                </section>
             </div>
             <div className="p-6 border-t bg-slate-50 flex gap-4">
                {selectedComplaint.status === 'pending' ? (
                  <button 
                    onClick={() => {
                      sosService.reviewComplaint(selectedComplaint.id);
                      setSelectedComplaint(null);
                    }}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Mark as Reviewed
                  </button>
                ) : (
                  <div className="flex-1 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs text-center border border-emerald-100 flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> STATUS: RESOLVED
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">SOS ADMIN</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveView('dashboard')} 
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Command Center
          </button>
          <button 
            onClick={() => setActiveView('reports')} 
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium ${activeView === 'reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Activity className="w-5 h-5" /> Incident Reports
          </button>
          <button 
            onClick={() => setActiveView('complaints')} 
            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all font-medium ${activeView === 'complaints' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" /> Student Reports
            </div>
            {pendingComplaintsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingComplaintsCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveView('registry')} 
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium ${activeView === 'registry' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users className="w-5 h-5" /> Student Registry
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-3.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold group">
             <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> Logout
           </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">
               {activeView === 'dashboard' ? 'Real-time Crisis Response' : 
                activeView === 'complaints' ? 'Grievance Management' :
                activeView === 'registry' ? 'Student Registry' : 'Incident Archive'}
             </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${activeAlertsCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {activeAlertsCount > 0 ? 'Alert Detected' : 'System Secure'}
            </span>
          </div>
        </header>
        
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'reports' && renderIncidentReports()}
        {activeView === 'registry' && renderStudentRegistry()}
        {activeView === 'complaints' && renderComplaints()}
      </main>

      {/* Student Editor Sliding Drawer */}
      {isStudentEditorOpen && (
        <div className="absolute inset-0 z-[120] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsStudentEditorOpen(false)} />
          <div className="w-[450px] h-full bg-white shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">{editingStudent ? 'Modify Member' : 'Register New Member'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Personnel Management System</p>
              </div>
              <button onClick={() => setIsStudentEditorOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
                      value={studentFormData.name}
                      onChange={e => setStudentFormData({...studentFormData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Roll Number (Unique ID)</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      required
                      disabled={!!editingStudent}
                      placeholder="e.g. 2420030098"
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-sm ${editingStudent ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={studentFormData.rollNumber}
                      onChange={e => setStudentFormData({...studentFormData, rollNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch / Dept</label>
                    <input 
                      required
                      placeholder="e.g. CSE"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
                      value={studentFormData.branch}
                      onChange={e => setStudentFormData({...studentFormData, branch: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Year</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm appearance-none"
                      value={studentFormData.year}
                      onChange={e => setStudentFormData({...studentFormData, year: e.target.value})}
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      required
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
                      value={studentFormData.phone}
                      onChange={e => setStudentFormData({...studentFormData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button 
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {editingStudent ? <Save className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  {editingStudent ? 'Update Registry' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Report Modal */}
      {isResolutionModalOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300" />
          <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in duration-300 relative">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">Finalize Incident</h2>
              <p className="text-slate-500 text-sm mb-8 px-8 leading-relaxed">Please provide a brief summary of the actions taken and the resolution status for the campus logs.</p>
              
              <div className="text-left space-y-2 mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resolution Summary</label>
                <textarea 
                  autoFocus
                  placeholder="Example: Medical team arrived within 3 mins. Student stabilized and moved to campus clinic. No further danger."
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm min-h-[140px] resize-none"
                  value={resolutionReport}
                  onChange={(e) => setResolutionReport(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsResolutionModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  disabled={!resolutionReport.trim()}
                  onClick={handleConfirmResolution}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Save & Close File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Detail Drawer */}
      {viewingArchiveAlert && (
        <div className="absolute inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setViewingArchiveAlert(null)} />
          <div className="w-[480px] h-full bg-white shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Archived SOS Log</h3>
                <button onClick={() => setViewingArchiveAlert(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 space-y-10">
                <section>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Incident Identification</label>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl font-black text-slate-400 border border-slate-100">{viewingArchiveAlert.student.name[0]}</div>
                    <div className="overflow-hidden">
                      <p className="font-black text-slate-900 text-xl tracking-tight truncate">{viewingArchiveAlert.student.name}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase">{viewingArchiveAlert.student.branch} • {viewingArchiveAlert.student.year}</p>
                      <div className="mt-2 text-[11px] font-mono text-slate-400">ID: {viewingArchiveAlert.student.rollNumber}</div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Event Context</label>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${EMERGENCY_CONFIG[viewingArchiveAlert.type].color}`}>{viewingArchiveAlert.type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Triggered</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(viewingArchiveAlert.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Resolved</p>
                      <p className="text-xs font-bold text-emerald-700">{viewingArchiveAlert.resolvedAt ? new Date(viewingArchiveAlert.resolvedAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resolution Report</label>
                  <div className="bg-white border-l-4 border-emerald-500 pl-6 py-4 shadow-sm rounded-r-2xl border border-emerald-100/50">
                    <p className="text-slate-700 leading-relaxed font-medium text-sm italic whitespace-pre-wrap">
                      "{viewingArchiveAlert.resolutionReport || "No formal resolution narrative was captured for this incident."}"
                    </p>
                  </div>
                </section>

                <section>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Location Record</label>
                  <div className="bg-slate-900 p-4 rounded-2xl text-emerald-500 font-mono text-[10px] flex items-center gap-3">
                    <MapPin className="w-4 h-4" />
                    LAT: {viewingArchiveAlert.location.lat} • LNG: {viewingArchiveAlert.location.lng}
                  </div>
                </section>
             </div>
             <div className="p-6 border-t bg-slate-50">
                <button 
                  onClick={() => setViewingArchiveAlert(null)}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                  Close Archive Record
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
