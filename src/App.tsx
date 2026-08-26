import React, { useState } from 'react';
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Settings,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Sparkles,
  Info,
  Image as ImageIcon,
  Bot,
  User,
  ArrowRight,
  RefreshCw,
  FileText,
  Search,
  ChevronRight,
  Building,
  Key,
  Phone,
  Mail,
  Filter
} from 'lucide-react';

import type {
  Vehicle,
  BuyerLead,
  SalesPolicy,
  OwnerEscalation,
  Appointment,
  ConversationMessage,
  Offer,
  IntegrationSettings
} from '../packages/domain/src/types';
import { decodeVin } from '../packages/domain/src/vin';
import { evaluateOffer } from '../packages/domain/src/pricing';
import { processBuyerMessage } from '../packages/domain/src/agent';

// Initial Mock Datasets (3 Realistic Vehicles)
const initialVehicles: Vehicle[] = [
  {
    id: 'veh_1',
    vin: '4T1B11HK5MW123456',
    year: 2021,
    make: 'Toyota',
    model: 'Camry',
    trim: 'SE Nightshade',
    bodyStyle: 'Sedan',
    engine: '2.5L 4-Cyl DOHC',
    transmission: '8-Speed Automatic',
    drivetrain: 'FWD',
    mileage: 28400,
    status: 'SELLING',
    askingPrice: 22500,
    targetPrice: 21000,
    minimumPrice: 19500,
    notes: 'Single owner, clean Carfax, non-smoker, fresh oil change.',
    provenance: [
      { field: 'year', source: 'NHTSA_vPIC_API', value: 2021, timestamp: '2026-08-25' },
      { field: 'make', source: 'NHTSA_vPIC_API', value: 'Toyota', timestamp: '2026-08-25' },
      { field: 'model', source: 'NHTSA_vPIC_API', value: 'Camry', timestamp: '2026-08-25' },
      { field: 'trim', source: 'NHTSA_vPIC_API', value: 'SE', timestamp: '2026-08-25' },
      { field: 'askingPrice', source: 'USER_INPUT', value: 22500, timestamp: '2026-08-25' },
      { field: 'minimumPrice', source: 'USER_INPUT', value: 19500, timestamp: '2026-08-25' },
    ],
    sourcePhotoIds: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop'],
    marketingPhotoIds: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop']
  },
  {
    id: 'veh_2',
    vin: '1HGCR2F83HA654321',
    year: 2022,
    make: 'Honda',
    model: 'Accord',
    trim: 'Sport 2.0T',
    bodyStyle: 'Sedan',
    engine: '2.0L Turbo 4-Cyl',
    transmission: '10-Speed Automatic',
    drivetrain: 'FWD',
    mileage: 19200,
    status: 'PUBLISHED',
    askingPrice: 26800,
    targetPrice: 25500,
    minimumPrice: 24000,
    notes: 'Apple CarPlay, heated seats, blind-spot monitoring.',
    provenance: [
      { field: 'year', source: 'NHTSA_vPIC_API', value: 2022, timestamp: '2026-08-25' },
      { field: 'make', source: 'NHTSA_vPIC_API', value: 'Honda', timestamp: '2026-08-25' },
      { field: 'model', source: 'NHTSA_vPIC_API', value: 'Accord', timestamp: '2026-08-25' },
      { field: 'askingPrice', source: 'USER_INPUT', value: 26800, timestamp: '2026-08-25' }
    ],
    sourcePhotoIds: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&auto=format&fit=crop'],
    marketingPhotoIds: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop']
  },
  {
    id: 'veh_3',
    vin: '5YJ3E1EA1KF987654',
    year: 2023,
    make: 'Tesla',
    model: 'Model 3',
    trim: 'Long Range Dual Motor',
    bodyStyle: 'Sedan',
    engine: 'Electric (Dual Motor)',
    transmission: 'Direct Drive',
    drivetrain: 'AWD',
    mileage: 14100,
    status: 'SELLING',
    askingPrice: 34500,
    targetPrice: 33000,
    minimumPrice: 31500,
    notes: 'Full Self-Driving package included, pristine condition.',
    provenance: [
      { field: 'year', source: 'NHTSA_vPIC_API', value: 2023, timestamp: '2026-08-25' },
      { field: 'make', source: 'NHTSA_vPIC_API', value: 'Tesla', timestamp: '2026-08-25' },
      { field: 'model', source: 'NHTSA_vPIC_API', value: 'Model 3', timestamp: '2026-08-25' },
      { field: 'askingPrice', source: 'USER_INPUT', value: 34500, timestamp: '2026-08-25' }
    ],
    sourcePhotoIds: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&auto=format&fit=crop'],
    marketingPhotoIds: ['https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=600&auto=format&fit=crop']
  }
];

const initialLeads: BuyerLead[] = [
  {
    id: 'lead_1',
    vehicleId: 'veh_1',
    name: 'Alex Rivera',
    contact: 'alex.r@example.com | (555) 234-5678',
    channel: 'Web Listing',
    status: 'ESCALATED',
    intentScore: 85,
    lastMessageAt: '10 mins ago',
    latestOffer: 18000
  },
  {
    id: 'lead_2',
    vehicleId: 'veh_1',
    name: 'Sarah Connor',
    contact: 'sarah.c@example.com',
    channel: 'Marketplace',
    status: 'SERIOUS',
    intentScore: 75,
    lastMessageAt: '1 hour ago'
  },
  {
    id: 'lead_3',
    vehicleId: 'veh_2',
    name: 'Marcus Vance',
    contact: 'marcus.v@example.com',
    channel: 'Autotrader',
    status: 'QUALIFYING',
    intentScore: 60,
    lastMessageAt: '3 hours ago'
  }
];

const initialEscalations: OwnerEscalation[] = [
  {
    id: 'esc_1',
    leadId: 'lead_1',
    vehicleId: 'veh_1',
    reason: 'Offer ($18,000) is below the owner\'s minimum floor price of $19,500.',
    intentScore: 85,
    currentAskingPrice: 22500,
    minimumPrice: 19500,
    latestOffer: 18000,
    recommendedAction: 'Counter at floor price $19,500 or request $19,000 with quick settlement.',
    status: 'PENDING',
    createdAt: '10:20 AM'
  }
];

const initialAppointments: Appointment[] = [
  {
    id: 'apt_1',
    vehicleId: 'veh_1',
    leadId: 'lead_2',
    buyerName: 'Sarah Connor',
    buyerContact: 'sarah.c@example.com',
    dateTime: 'Tomorrow at 3:00 PM',
    location: '123 Dealership Way, Austin TX',
    status: 'CONFIRMED',
    notes: 'Test drive scheduled after price target agreement'
  }
];

export default function App() {
  const [navSection, setNavSection] = useState<'dashboard' | 'inventory' | 'cockpit' | 'leads' | 'appointments' | 'offers' | 'escalations' | 'settings'>('dashboard');

  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('veh_1');

  const [leads, setLeads] = useState<BuyerLead[]>(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('lead_1');

  const [escalations, setEscalations] = useState<OwnerEscalation[]>(initialEscalations);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

  const [policy, setPolicy] = useState<SalesPolicy>({
    askingPrice: 22500,
    targetPrice: 21000,
    minimumPrice: 19500,
    allowAutomaticAcceptance: true,
    requireOwnerForBelowFloor: true,
    requireOwnerForAppointment: true,
    negotiationIncrement: 500
  });

  const [settings, setSettings] = useState<IntegrationSettings>({
    ownerName: 'James Miller',
    ownerEmail: 'owner@apexmotors.com',
    ownerPhone: '(555) 019-2831',
    dealershipName: 'Apex Motor Sales',
    openaiApiKey: '',
    anthropicApiKey: '',
    nhtsaApiEnabled: true,
    autoScheduleAppointments: false
  });

  // Modal controls
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isScheduleAptOpen, setIsScheduleAptOpen] = useState(false);

  // Add Vehicle Form State
  const [vinInput, setVinInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Conversations Map
  const [conversations, setConversations] = useState<Record<string, ConversationMessage[]>>({
    lead_1: [
      {
        id: 'msg_1',
        leadId: 'lead_1',
        sender: 'BUYER',
        text: 'Hi, is the 2021 Toyota Camry still available?',
        createdAt: '10:15 AM'
      },
      {
        id: 'msg_2',
        leadId: 'lead_1',
        sender: 'AGENT',
        text: 'Yes it is! Asking price is $22,500. It has 28,400 miles and a clean title. Would you like to schedule a test drive or make an offer?',
        createdAt: '10:16 AM',
        toolCalls: [
          { toolName: 'get_vehicle', args: { vin: '4T1B11HK5MW123456' }, result: { available: true, mileage: 28400 }, timestamp: '10:16 AM' }
        ]
      },
      {
        id: 'msg_3',
        leadId: 'lead_1',
        sender: 'BUYER',
        text: 'I can pay $18,000 cash right now.',
        createdAt: '10:20 AM'
      },
      {
        id: 'msg_4',
        leadId: 'lead_1',
        sender: 'AGENT',
        text: 'Thank you for your offer of $18,000. Because this offer requires owner review, I have submitted it directly to the owner for immediate consideration. I will follow up with you as soon as they review it!',
        createdAt: '10:20 AM',
        toolCalls: [
          { toolName: 'evaluate_offer', args: { amount: 18000 }, result: { decision: 'ESCALATE', reason: 'Offer ($18,000) is below floor ($19,500)' }, timestamp: '10:20 AM' },
          { toolName: 'create_owner_escalation', args: { reason: 'Offer below minimum price floor' }, result: { escalationId: 'esc_1' }, timestamp: '10:20 AM' }
        ]
      }
    ]
  });

  const [chatInput, setChatInput] = useState('');

  const currentVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  const currentLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  // Decode VIN handler
  const handleDecodeVin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vinInput || vinInput.length !== 17) {
      setDecodeError('Please enter a valid 17-character VIN.');
      return;
    }
    setDecodeError(null);
    setIsDecoding(true);
    try {
      const decoded = await decodeVin(vinInput);
      const newVeh: Vehicle = {
        id: `veh_${Date.now()}`,
        vin: decoded.vin,
        year: decoded.year || 2022,
        make: decoded.make || 'Generic',
        model: decoded.model || 'Vehicle',
        trim: decoded.trim || 'Standard',
        bodyStyle: decoded.bodyStyle || 'Sedan',
        engine: decoded.engine || '2.0L 4-Cyl',
        transmission: decoded.transmission || 'Automatic',
        drivetrain: decoded.drivetrain || 'FWD',
        mileage: 15000,
        status: 'READY',
        askingPrice: 25000,
        targetPrice: 23500,
        minimumPrice: 22000,
        notes: 'Imported via NHTSA vPIC API.',
        provenance: decoded.provenance,
        sourcePhotoIds: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop'],
        marketingPhotoIds: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop']
      };
      setVehicles([newVeh, ...vehicles]);
      setSelectedVehicleId(newVeh.id);
      setVinInput('');
      setIsAddVehicleOpen(false);
      setNavSection('cockpit');
    } catch (err: any) {
      setDecodeError(err.message || 'Failed to decode VIN.');
    } finally {
      setIsDecoding(false);
    }
  };

  // Chat message sending simulation
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const leadId = selectedLeadId;
    const userMsg: ConversationMessage = {
      id: `msg_${Date.now()}`,
      leadId,
      sender: 'BUYER',
      text,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...(conversations[leadId] || []), userMsg];
    setConversations({ ...conversations, [leadId]: updatedHistory });
    setChatInput('');

    setTimeout(() => {
      const agentRes = processBuyerMessage(currentLead, currentVehicle, policy, text, updatedHistory);

      const agentMsg: ConversationMessage = {
        id: `msg_${Date.now() + 1}`,
        leadId,
        sender: 'AGENT',
        text: agentRes.replyText,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: agentRes.toolCalls
      };

      setConversations(prev => ({
        ...prev,
        [leadId]: [...(prev[leadId] || []), agentMsg]
      }));

      setLeads(prev => prev.map(l => l.id === leadId ? {
        ...l,
        status: agentRes.leadStatus,
        intentScore: agentRes.intentScore,
        lastMessageAt: 'Just now'
      } : l));

      if (agentRes.escalation) {
        setEscalations(prev => [agentRes.escalation!, ...prev]);
      }

      if (agentRes.appointment) {
        setAppointments(prev => [agentRes.appointment!, ...prev]);
      }
    }, 400);
  };

  // Escalation action execution
  const handleEscalationAction = (escId: string, action: 'APPROVE' | 'COUNTER' | 'DECLINE') => {
    const esc = escalations.find(e => e.id === escId);
    if (!esc) return;

    setEscalations(prev => prev.map(e => e.id === escId ? {
      ...e,
      status: action === 'APPROVE' ? 'APPROVED' : action === 'COUNTER' ? 'COUNTERED' : 'DECLINED'
    } : e));

    const leadId = esc.leadId;
    let reply = '';
    if (action === 'APPROVE') {
      reply = `Update from Owner: Your offer of $${esc.latestOffer?.toLocaleString()} has been approved! Let's schedule your appointment.`;
    } else if (action === 'COUNTER') {
      reply = `Update from Owner: The lowest acceptable price for this vehicle is $${policy.minimumPrice.toLocaleString()}. Let us know if that works for you!`;
    } else {
      reply = `Update from Owner: Unfortunately we cannot accept that offer at this time. Thank you for your interest!`;
    }

    const ownerMsg: ConversationMessage = {
      id: `msg_owner_${Date.now()}`,
      leadId,
      sender: 'OWNER',
      text: reply,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => ({
      ...prev,
      [leadId]: [...(prev[leadId] || []), ownerMsg]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between hidden md:flex">
        <div className="p-5 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight block">Car Salesman</span>
              <span className="text-xs text-indigo-400 font-medium">{settings.dealershipName}</span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'inventory', label: 'Inventory', icon: Car, count: vehicles.length },
              { id: 'cockpit', label: 'Sales Cockpit', icon: Sparkles },
              { id: 'leads', label: 'Leads', icon: Users, count: leads.length },
              { id: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
              { id: 'escalations', label: 'Escalations Queue', icon: AlertTriangle, count: escalations.filter(e => e.status === 'PENDING').length },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = navSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setNavSection(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-gray-800 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom AI Guardrail Status */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/60 m-3 rounded-xl">
          <div className="flex items-center space-x-2 text-xs font-semibold text-green-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>AI Pricing Guardrails</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-tight">
            Floor protection active. LLM cannot accept below ${policy.minimumPrice.toLocaleString()}.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
              Car Salesman Cockpit
            </span>
            <span className="text-gray-600 hidden sm:inline">/</span>
            <span className="text-sm font-bold text-white capitalize">{navSection}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAddVehicleOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition shadow-lg shadow-indigo-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Vehicle by VIN</span>
            </button>
          </div>
        </header>

        {/* Dynamic Screen View Switching */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* 1. DASHBOARD VIEW */}
          {navSection === 'dashboard' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">Dealership Overview</h1>
                  <p className="text-sm text-gray-400">Autonomous sales employee performance and action summary.</p>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Active Inventory</span>
                    <Car className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{vehicles.length} Vehicles</div>
                  <span className="text-xs text-green-400 font-medium mt-1 inline-block">100% Verified Specs</span>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Buyer Leads</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{leads.length} Active</div>
                  <span className="text-xs text-indigo-400 font-medium mt-1 inline-block">Auto-qualifying active</span>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Appointments</span>
                    <Calendar className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{appointments.length} Scheduled</div>
                  <span className="text-xs text-gray-400 font-medium mt-1 inline-block">Test drive requests</span>
                </div>

                <div className="bg-gray-900 border border-red-500/30 p-5 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Escalation Queue</span>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{escalations.filter(e => e.status === 'PENDING').length} Pending</div>
                  <span className="text-xs text-red-400 font-medium mt-1 inline-block">Requires Owner Approval</span>
                </div>
              </div>

              {/* Recent Activity & Inventory Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <h3 className="font-bold text-white text-base">Active Vehicles & Pricing Rules</h3>
                    <button
                      onClick={() => setNavSection('inventory')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      View All Inventory &rarr;
                    </button>
                  </div>
                  <div className="space-y-3">
                    {vehicles.map(v => (
                      <div key={v.id} className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img src={v.sourcePhotoIds[0]} alt={v.model} className="w-14 h-14 object-cover rounded-lg border border-gray-800" />
                          <div>
                            <h4 className="font-bold text-white text-sm">{v.year} {v.make} {v.model} {v.trim}</h4>
                            <span className="text-xs text-gray-400 font-mono">VIN: {v.vin}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">${(v.askingPrice || 0).toLocaleString()}</div>
                          <div className="text-xs text-yellow-400 font-semibold">Floor: ${(v.minimumPrice || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent Activity Stream */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400" /> AI Agent Tool Execution Stream
                  </h3>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 space-y-1">
                      <div className="text-indigo-400 font-bold">tool: evaluate_offer</div>
                      <div className="text-gray-300">Offer $18,000 against floor $19,500</div>
                      <div className="text-red-400 text-[10px]">Decision: ESCALATE</div>
                    </div>
                    <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 space-y-1">
                      <div className="text-green-400 font-bold">tool: get_vehicle</div>
                      <div className="text-gray-300">NHTSA Decoded specs for 4T1B11HK5MW123456</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. INVENTORY VIEW */}
          {navSection === 'inventory' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">Vehicle Inventory ({vehicles.length})</h1>
                  <p className="text-sm text-gray-400">All inventory records, verified specs, and active pricing floors.</p>
                </div>
                <button
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Vehicle by VIN</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map(v => (
                  <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="aspect-video bg-gray-950 relative">
                        <img src={v.sourcePhotoIds[0]} alt={v.model} className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur text-white text-xs font-bold border border-white/10">
                          {v.status}
                        </span>
                        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-bold shadow">
                          ${(v.askingPrice || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-bold text-white text-lg">{v.year} {v.make} {v.model}</h3>
                          <p className="text-xs text-indigo-400 font-semibold">{v.trim}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-950 p-3 rounded-lg border border-gray-800">
                          <div>
                            <span className="text-gray-400 block">VIN</span>
                            <span className="font-mono text-gray-200">{v.vin.substring(0, 10)}...</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Mileage</span>
                            <span className="text-gray-200 font-semibold">{v.mileage?.toLocaleString()} mi</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Target Price</span>
                            <span className="text-indigo-400 font-semibold">${(v.targetPrice || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Floor Price</span>
                            <span className="text-yellow-400 font-semibold">${(v.minimumPrice || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <button
                        onClick={() => {
                          setSelectedVehicleId(v.id);
                          setNavSection('cockpit');
                        }}
                        className="w-full py-2.5 bg-gray-800 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Open Sales Cockpit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. SALES COCKPIT VIEW */}
          {navSection === 'cockpit' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {currentVehicle.year} {currentVehicle.make} {currentVehicle.model} {currentVehicle.trim}
                  </h1>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">Canonical Record VIN: {currentVehicle.vin}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">Switch Vehicle:</span>
                  <select
                    value={selectedVehicleId}
                    onChange={e => setSelectedVehicleId(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white text-xs font-semibold px-3 py-2 rounded-lg"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vehicle Specs & Provenance */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" /> NHTSA Verified Vehicle Specifications
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs">
                      <div>
                        <span className="text-gray-400 block">Body Style</span>
                        <span className="font-semibold text-white">{currentVehicle.bodyStyle}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Engine</span>
                        <span className="font-semibold text-white">{currentVehicle.engine}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Transmission</span>
                        <span className="font-semibold text-white">{currentVehicle.transmission}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Drivetrain</span>
                        <span className="font-semibold text-white">{currentVehicle.drivetrain}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Mileage</span>
                        <span className="font-semibold text-white">{currentVehicle.mileage?.toLocaleString()} miles</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Condition Notes</span>
                        <span className="font-semibold text-gray-300">{currentVehicle.notes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fact Provenance Audit Log */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-400" /> Data Source Provenance Audit Log
                    </h3>
                    <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-gray-900 border-b border-gray-800 text-gray-400 font-medium">
                          <tr>
                            <th className="px-4 py-2.5">Fact</th>
                            <th className="px-4 py-2.5">Data Source</th>
                            <th className="px-4 py-2.5">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60 text-gray-300">
                          {currentVehicle.provenance.map((p, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 font-mono text-indigo-300">{p.field}</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20 text-[11px]">
                                  {p.source}
                                </span>
                              </td>
                              <td className="px-4 py-2 font-medium">{String(p.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Interactive AI Salesman Simulator */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">Interactive AI Salesman Simulator</h3>
                          <p className="text-xs text-gray-400">Test autonomous negotiations inside owner pricing rules.</p>
                        </div>
                      </div>
                    </div>

                    <div className="h-64 bg-gray-950/80 rounded-xl p-4 overflow-y-auto space-y-3 border border-gray-800">
                      {(conversations[selectedLeadId] || []).map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'BUYER' ? 'items-start' : 'items-end'}`}>
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <span className="text-[10px] text-gray-400">{msg.createdAt}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              msg.sender === 'BUYER' ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'
                            }`}>
                              {msg.sender}
                            </span>
                          </div>
                          <div className={`p-3 rounded-xl text-xs max-w-sm ${
                            msg.sender === 'BUYER' ? 'bg-gray-800 text-white' : 'bg-indigo-600 text-white'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleSendMessage(chatInput);
                      }}
                      className="flex space-x-2"
                    >
                      <input
                        type="text"
                        placeholder="Type offer or buyer question (e.g. 'I offer $18,000')..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-xs text-white"
                      />
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-lg text-xs font-semibold">
                        Send
                      </button>
                    </form>
                  </div>
                </div>

                {/* Sales Policy Controls Sidebar */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
                  <div className="flex items-center space-x-2 border-b border-gray-800 pb-4">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <div>
                      <h3 className="text-base font-bold text-white">Owner Pricing Guardrails</h3>
                      <p className="text-xs text-gray-400">Deterministic rules enforced for this vehicle.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Asking Price ($)</label>
                      <input
                        type="number"
                        value={policy.askingPrice || 0}
                        onChange={e => setPolicy({ ...policy, askingPrice: Number(e.target.value) })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Target Price ($)</label>
                      <input
                        type="number"
                        value={policy.targetPrice || 0}
                        onChange={e => setPolicy({ ...policy, targetPrice: Number(e.target.value) })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-indigo-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">
                        Minimum Floor Price ($) <span className="text-red-400 text-[10px]">(Hard Limit)</span>
                      </label>
                      <input
                        type="number"
                        value={policy.minimumPrice || 0}
                        onChange={e => setPolicy({ ...policy, minimumPrice: Number(e.target.value) })}
                        className="w-full bg-gray-950 border border-red-500/40 rounded-lg px-3 py-2 text-xs text-red-400 font-bold"
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-800 space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policy.allowAutomaticAcceptance}
                          onChange={e => setPolicy({ ...policy, allowAutomaticAcceptance: e.target.checked })}
                          className="w-4 h-4 rounded bg-gray-950 border-gray-800 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-xs text-gray-300">Allow AI to accept offers at target price</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policy.requireOwnerForBelowFloor}
                          onChange={e => setPolicy({ ...policy, requireOwnerForBelowFloor: e.target.checked })}
                          className="w-4 h-4 rounded bg-gray-950 border-gray-800 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-xs text-gray-300">Escalate all below-floor offers</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. LEADS VIEW */}
          {navSection === 'leads' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">Lead Management</h1>
                  <p className="text-sm text-gray-400">Track interested buyers, qualification status, and negotiation intent.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {leads.map(lead => (
                  <div key={lead.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-base">{lead.name}</h3>
                        <p className="text-xs text-gray-400">{lead.contact}</p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded font-bold ${
                        lead.status === 'ESCALATED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Channel:</span>
                        <span className="text-gray-200 font-semibold">{lead.channel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Intent Score:</span>
                        <span className="text-green-400 font-semibold">{lead.intentScore}% High</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setNavSection('cockpit');
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition"
                    >
                      Open Conversation Thread
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. APPOINTMENTS VIEW */}
          {navSection === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">Scheduled Test Drive Appointments</h1>
                  <p className="text-sm text-gray-400">Physical access and appointment scheduling engine.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.map(apt => (
                  <div key={apt.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-lg">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{apt.buyerName}</h3>
                          <p className="text-xs text-gray-400">{apt.buyerContact}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30 uppercase">
                        {apt.status}
                      </span>
                    </div>

                    <div className="bg-gray-950 p-4 rounded-lg border border-gray-800/80 space-y-2 text-xs">
                      <div className="flex items-center text-gray-300 gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-white">{apt.dateTime}</span>
                      </div>
                      <div className="flex items-center text-gray-400 gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span>{currentVehicle.year} {currentVehicle.make} {currentVehicle.model}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ESCALATIONS VIEW */}
          {navSection === 'escalations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">Owner Escalation Queue</h1>
                  <p className="text-sm text-gray-400">High-value offers requiring human owner authorization.</p>
                </div>
              </div>

              {escalations.filter(e => e.status === 'PENDING').map(esc => (
                <div key={esc.id} className="bg-gray-900 border border-red-500/40 rounded-xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded uppercase">
                      Action Required
                    </span>
                    <span className="text-xs text-gray-400">{esc.createdAt}</span>
                  </div>

                  <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 text-xs space-y-2">
                    <p className="text-gray-200"><strong>Reason:</strong> {esc.reason}</p>
                    <p className="text-indigo-400"><strong>Agent Recommendation:</strong> {esc.recommendedAction}</p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEscalationAction(esc.id, 'APPROVE')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-xs rounded-lg"
                    >
                      Approve Offer (${esc.latestOffer?.toLocaleString()})
                    </button>
                    <button
                      onClick={() => handleEscalationAction(esc.id, 'COUNTER')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg"
                    >
                      Counter at Floor (${policy.minimumPrice.toLocaleString()})
                    </button>
                    <button
                      onClick={() => handleEscalationAction(esc.id, 'DECLINE')}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs rounded-lg"
                    >
                      Decline Offer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 7. SETTINGS VIEW */}
          {navSection === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold text-white">Application & Service Settings</h1>
                <p className="text-sm text-gray-400">Owner configuration, LLM API credentials, and NHTSA provider options.</p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
                <h3 className="font-bold text-white text-base border-b border-gray-800 pb-3">
                  Owner Identity & Dealership Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-gray-300 block mb-1">Owner Name</label>
                    <input
                      type="text"
                      value={settings.ownerName}
                      onChange={e => setSettings({ ...settings, ownerName: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1">Dealership Name</label>
                    <input
                      type="text"
                      value={settings.dealershipName}
                      onChange={e => setSettings({ ...settings, dealershipName: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1">Notification Email</label>
                    <input
                      type="email"
                      value={settings.ownerEmail}
                      onChange={e => setSettings({ ...settings, ownerEmail: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1">Notification Phone</label>
                    <input
                      type="text"
                      value={settings.ownerPhone}
                      onChange={e => setSettings({ ...settings, ownerPhone: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <h3 className="font-bold text-white text-base border-b border-gray-800 pb-3 pt-4">
                  LLM AI Provider API Connections (Optional)
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-gray-300 block mb-1">OpenAI API Key (e.g. gpt-4o)</label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={settings.openaiApiKey}
                      onChange={e => setSettings({ ...settings, openaiApiKey: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 block mb-1">Anthropic API Key (e.g. claude-3-5-sonnet)</label>
                    <input
                      type="password"
                      placeholder="sk-ant-..."
                      value={settings.anthropicApiKey}
                      onChange={e => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Vehicle Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
              <h3 className="font-bold text-white text-lg">Add Vehicle via VIN</h3>
              <button onClick={() => setIsAddVehicleOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleDecodeVin} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 block mb-1">Enter 17-Character VIN</label>
                <input
                  type="text"
                  maxLength={17}
                  placeholder="e.g. 4T1B11HK5MW123456"
                  value={vinInput}
                  onChange={e => setVinInput(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white font-mono uppercase"
                />
                {decodeError && <p className="text-red-400 mt-1">{decodeError}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDecoding}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg"
                >
                  {isDecoding ? 'Decoding...' : 'Decode & Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
