import React, { useState } from 'react';
import {
  Car,
  ShieldCheck,
  MessageSquare,
  Calendar,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Clock,
  Send,
  Sparkles,
  Info,
  Image as ImageIcon,
  Bot,
  User,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  FileText
} from 'lucide-react';

import type { Vehicle, BuyerLead, SalesPolicy, OwnerEscalation, Appointment, ConversationMessage, FactProvenance } from '../packages/domain/src/types';
import { decodeVin } from '../packages/domain/src/vin';
import { evaluateOffer } from '../packages/domain/src/pricing';
import { processBuyerMessage } from '../packages/domain/src/agent';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'vehicles' | 'chat' | 'appointments'>('today');

  // Initial Mock Vehicle
  const [vehicles, setVehicles] = useState<Vehicle[]>([
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
      notes: 'Single owner, clean Carfax, nonsmoker vehicle.',
      provenance: [
        { field: 'year', source: 'NHTSA_vPIC_API', value: 2021, timestamp: new Date().toISOString() },
        { field: 'make', source: 'NHTSA_vPIC_API', value: 'Toyota', timestamp: new Date().toISOString() },
        { field: 'model', source: 'NHTSA_vPIC_API', value: 'Camry', timestamp: new Date().toISOString() },
        { field: 'trim', source: 'NHTSA_vPIC_API', value: 'SE', timestamp: new Date().toISOString() },
        { field: 'askingPrice', source: 'USER_INPUT', value: 22500, timestamp: new Date().toISOString() },
        { field: 'minimumPrice', source: 'USER_INPUT', value: 19500, timestamp: new Date().toISOString() },
      ],
      sourcePhotoIds: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop'],
      marketingPhotoIds: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop']
    }
  ]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('veh_1');

  // Sales policy state
  const [policy, setPolicy] = useState<SalesPolicy>({
    askingPrice: 22500,
    targetPrice: 21000,
    minimumPrice: 19500,
    allowAutomaticAcceptance: true,
    requireOwnerForBelowFloor: true,
    requireOwnerForAppointment: true,
    negotiationIncrement: 500
  });

  // Buyer leads state
  const [leads, setLeads] = useState<BuyerLead[]>([
    {
      id: 'lead_1',
      vehicleId: 'veh_1',
      name: 'Alex Rivera',
      contact: 'alex.r@example.com | (555) 234-5678',
      channel: 'Web Listing',
      status: 'ESCALATED',
      intentScore: 85,
      lastMessageAt: '10 mins ago'
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
    }
  ]);

  const [selectedLeadId, setSelectedLeadId] = useState<string>('lead_1');

  // Conversation history
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

  // Owner Escalation Queue
  const [escalations, setEscalations] = useState<OwnerEscalation[]>([
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
  ]);

  // Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>([
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
  ]);

  // New VIN Form State
  const [vinInput, setVinInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Chat simulator input
  const [chatInput, setChatInput] = useState('');

  // Current active vehicle
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
      setActiveTab('vehicles');
    } catch (err: any) {
      setDecodeError(err.message || 'Failed to decode VIN.');
    } finally {
      setIsDecoding(false);
    }
  };

  // Send message in simulator
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

    // Agent response logic
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

      // Update lead intent/status
      setLeads(prev => prev.map(l => l.id === leadId ? {
        ...l,
        status: agentRes.leadStatus,
        intentScore: agentRes.intentScore,
        lastMessageAt: 'Just now'
      } : l));

      // Handle escalation if created
      if (agentRes.escalation) {
        setEscalations(prev => [agentRes.escalation!, ...prev]);
      }

      // Handle appointment if created
      if (agentRes.appointment) {
        setAppointments(prev => [agentRes.appointment!, ...prev]);
      }
    }, 400);
  };

  // Escalation Action Handlers
  const handleEscalationAction = (escId: string, action: 'APPROVE' | 'COUNTER' | 'DECLINE') => {
    const esc = escalations.find(e => e.id === escId);
    if (!esc) return;

    setEscalations(prev => prev.map(e => e.id === escId ? { ...e, status: action === 'APPROVE' ? 'APPROVED' : action === 'COUNTER' ? 'COUNTERED' : 'DECLINED' } : e));

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
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-gray-800 bg-gray-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">Car Salesman</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                AI Agent Cockpit
              </span>
            </div>
          </div>

          <nav className="flex space-x-1 sm:space-x-2">
            {[
              { id: 'today', label: 'Today Inbox', icon: AlertTriangle, count: escalations.filter(e => e.status === 'PENDING').length },
              { id: 'vehicles', label: 'Vehicles', icon: Car },
              { id: 'chat', label: 'Buyer Chat', icon: MessageSquare },
              { id: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white text-indigo-600' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TODAY / OWNER ESCALATION QUEUE */}
        {activeTab === 'today' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Owner Decision Queue</h1>
                <p className="text-sm text-gray-400">Review high-value buyer offers, inspection requests, and items outside AI authority.</p>
              </div>
              <span className="text-xs px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Deterministic Guardrails Active
              </span>
            </div>

            {escalations.filter(e => e.status === 'PENDING').length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-semibold text-white">All Clear! No Pending Escalations</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto mt-1">
                  Your AI sales employee is autonomously qualifying leads and negotiating within your defined price policy ($${policy.minimumPrice.toLocaleString()} minimum floor).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {escalations.filter(e => e.status === 'PENDING').map(esc => {
                  const lead = leads.find(l => l.id === esc.leadId);
                  const veh = vehicles.find(v => v.id === esc.vehicleId);
                  return (
                    <div key={esc.id} className="bg-gray-900 border border-red-500/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Action Required
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {esc.createdAt}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {veh ? `${veh.year} ${veh.make} ${veh.model} ${veh.trim}` : 'Vehicle Action'}
                            </h3>
                            <p className="text-sm text-gray-300 font-medium mt-1">
                              Buyer: <span className="text-white font-semibold">{lead?.name || 'Interested Buyer'}</span> ({lead?.contact || 'N/A'})
                            </p>
                          </div>

                          <div className="bg-gray-950/80 border border-gray-800 rounded-lg p-4 space-y-2">
                            <div className="flex items-start space-x-2">
                              <Info className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-200"><strong className="text-orange-400">Reason:</strong> {esc.reason}</p>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-300"><strong className="text-indigo-400">Agent Recommendation:</strong> {esc.recommendedAction}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-950/40 p-3 rounded-lg border border-gray-800/80">
                            <div>
                              <span className="text-xs text-gray-400 block">Asking Price</span>
                              <span className="text-sm font-bold text-white">${esc.currentAskingPrice.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 block">Floor Price</span>
                              <span className="text-sm font-bold text-yellow-400">${esc.minimumPrice.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 block">Latest Offer</span>
                              <span className="text-sm font-bold text-red-400">${esc.latestOffer ? esc.latestOffer.toLocaleString() : 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 block">Buyer Intent</span>
                              <span className="text-sm font-bold text-green-400">{esc.intentScore}% High</span>
                            </div>
                          </div>
                        </div>

                        {/* One-Tap Action Buttons */}
                        <div className="lg:w-64 flex flex-col justify-center space-y-3 bg-gray-950/60 p-4 rounded-xl border border-gray-800">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block text-center mb-1">
                            One-Tap Owner Decisions
                          </span>

                          <button
                            onClick={() => handleEscalationAction(esc.id, 'APPROVE')}
                            className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-green-600/20"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve Offer (${esc.latestOffer?.toLocaleString()})</span>
                          </button>

                          <button
                            onClick={() => handleEscalationAction(esc.id, 'COUNTER')}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/20"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Counter at Floor (${policy.minimumPrice.toLocaleString()})</span>
                          </button>

                          <button
                            onClick={() => handleEscalationAction(esc.id, 'DECLINE')}
                            className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg text-sm flex items-center justify-center space-x-2 transition"
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span>Decline Offer</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedLeadId(esc.leadId);
                              setActiveTab('chat');
                            }}
                            className="w-full py-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium text-center flex items-center justify-center space-x-1 mt-2"
                          >
                            <span>Open Conversation History</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VEHICLES VIEW (VIN Ingestion, Fact Provenance, Photos & Policy) */}
        {activeTab === 'vehicles' && (
          <div className="space-y-8">
            {/* Header + Add VIN Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Add Vehicle via VIN</h2>
                    <p className="text-xs text-gray-400">Decodes verified specs using official NHTSA vPIC API without inventing facts.</p>
                  </div>
                </div>

                <form onSubmit={handleDecodeVin} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      maxLength={17}
                      placeholder="Enter 17-character VIN (e.g. 4T1B11HK5MW123456)"
                      value={vinInput}
                      onChange={e => setVinInput(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
                    />
                    {decodeError && <p className="text-xs text-red-400 mt-1">{decodeError}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={isDecoding}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm flex items-center justify-center space-x-2 transition"
                  >
                    {isDecoding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isDecoding ? 'Decoding...' : 'Decode & Import'}</span>
                  </button>
                </form>
              </div>

              {/* Vehicle Switcher Card */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inventory ({vehicles.length})</h3>
                  <div className="space-y-2">
                    {vehicles.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`w-full text-left p-3 rounded-lg text-sm font-medium transition flex items-center justify-between border ${
                          selectedVehicleId === v.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-gray-950 border-gray-800/80 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{v.year} {v.make} {v.model}</div>
                          <div className="text-xs text-gray-400 font-mono">{v.vin}</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-semibold">
                          ${(v.askingPrice || 0).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Vehicle Detail Cockpit */}
            {currentVehicle && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Specs & Fact Provenance */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
                  <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {currentVehicle.year} {currentVehicle.make} {currentVehicle.model} {currentVehicle.trim}
                      </h2>
                      <p className="text-sm text-gray-400 font-mono mt-0.5">VIN: {currentVehicle.vin}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold rounded-full uppercase">
                      Status: {currentVehicle.status}
                    </span>
                  </div>

                  {/* Fact Grid */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" /> Verified Vehicle Specifications
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <div>
                        <span className="text-xs text-gray-400 block">Body Style</span>
                        <span className="text-sm font-semibold text-white">{currentVehicle.bodyStyle || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">Engine</span>
                        <span className="text-sm font-semibold text-white">{currentVehicle.engine || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">Transmission</span>
                        <span className="text-sm font-semibold text-white">{currentVehicle.transmission || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">Drivetrain</span>
                        <span className="text-sm font-semibold text-white">{currentVehicle.drivetrain || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">Verified Mileage</span>
                        <span className="text-sm font-semibold text-white">{currentVehicle.mileage ? `${currentVehicle.mileage.toLocaleString()} miles` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">Condition Notes</span>
                        <span className="text-sm font-semibold text-gray-300">{currentVehicle.notes || 'Clean'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fact Provenance Audit Trail */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-400" /> Data Source Provenance Log
                    </h3>
                    <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
                      <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-gray-900 border-b border-gray-800 text-gray-400 font-medium">
                          <tr>
                            <th className="px-4 py-2.5">Fact Field</th>
                            <th className="px-4 py-2.5">Source Provider</th>
                            <th className="px-4 py-2.5">Decoded Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                          {currentVehicle.provenance.map((p, idx) => (
                            <tr key={idx} className="hover:bg-gray-900/40">
                              <td className="px-4 py-2 font-mono font-semibold text-indigo-300">{p.field}</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold text-[11px] border border-blue-500/20">
                                  {p.source}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-white font-medium">{String(p.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Media Handling: Documentary vs Marketing */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" /> Media Strategy & Image Guardrails
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Documentary Photos */}
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Documentary Photos (Source Truth)
                          </span>
                          <span className="text-[10px] text-gray-400">Unmodified</span>
                        </div>
                        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800 relative">
                          <img src={currentVehicle.sourcePhotoIds[0]} alt="Source vehicle photo" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[10px] rounded backdrop-blur font-semibold">
                            Authentic Photo #1
                          </span>
                        </div>
                      </div>

                      {/* Marketing Photos */}
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Marketing Assets (Labeled)
                          </span>
                          <span className="text-[10px] text-gray-400">AI Background</span>
                        </div>
                        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-800 relative">
                          <img src={currentVehicle.marketingPhotoIds[0]} alt="Generated marketing concept" className="w-full h-full object-cover opacity-90" />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-purple-900/90 text-purple-200 text-[10px] rounded backdrop-blur font-semibold border border-purple-500/30">
                            Marketing Render — Labeled
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales Policy Controls */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
                  <div className="flex items-center space-x-2 border-b border-gray-800 pb-4">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Pricing & Negotiation Policy</h3>
                      <p className="text-xs text-gray-400">Strict rules enforced by pricing engine.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Asking Price ($)</label>
                      <input
                        type="number"
                        value={policy.askingPrice || 0}
                        onChange={e => setPolicy({ ...policy, askingPrice: Number(e.target.value) })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Target Price ($)</label>
                      <input
                        type="number"
                        value={policy.targetPrice || 0}
                        onChange={e => setPolicy({ ...policy, targetPrice: Number(e.target.value) })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-indigo-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">
                        Minimum Floor Price ($) <span className="text-red-400 text-[10px]">(Hard Stop)</span>
                      </label>
                      <input
                        type="number"
                        value={policy.minimumPrice || 0}
                        onChange={e => setPolicy({ ...policy, minimumPrice: Number(e.target.value) })}
                        className="w-full bg-gray-950 border border-red-500/40 rounded-lg px-3 py-2 text-sm text-red-400 font-bold"
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
                        <span className="text-xs text-gray-300">Allow AI to accept offers at or above target price</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policy.requireOwnerForBelowFloor}
                          onChange={e => setPolicy({ ...policy, requireOwnerForBelowFloor: e.target.checked })}
                          className="w-4 h-4 rounded bg-gray-950 border-gray-800 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-xs text-gray-300">Escalate all below-floor offers to owner queue</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policy.requireOwnerForAppointment}
                          onChange={e => setPolicy({ ...policy, requireOwnerForAppointment: e.target.checked })}
                          className="w-4 h-4 rounded bg-gray-950 border-gray-800 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-xs text-gray-300">Require owner approval for test drive appointments</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INTERACTIVE BUYER CHAT SIMULATOR */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[720px]">
            {/* Lead Selector Sidebar */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Buyer Leads</h3>
                <div className="space-y-2">
                  {leads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`w-full text-left p-3 rounded-lg transition border ${
                        selectedLeadId === lead.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-white">{lead.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          lead.status === 'ESCALATED' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{lead.contact}</div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2">
                        <span>Intent: {lead.intentScore}%</span>
                        <span>{lead.lastMessageAt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Sample Prompts */}
              <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Simulate Buyer Action:</span>
                <div className="flex flex-col gap-1.5 text-xs">
                  <button
                    onClick={() => handleSendMessage('I want to offer $17,500 cash today.')}
                    className="text-left px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 font-medium"
                  >
                    💬 Submit Below-Floor Offer ($17,500)
                  </button>
                  <button
                    onClick={() => handleSendMessage('Can we do $21,500?')}
                    className="text-left px-2.5 py-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 font-medium"
                  >
                    💬 Offer Authorized Target ($21,500)
                  </button>
                  <button
                    onClick={() => handleSendMessage('Can I schedule a test drive for tomorrow?')}
                    className="text-left px-2.5 py-1.5 rounded bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/20 font-medium"
                  >
                    📅 Request Appointment / Test Drive
                  </button>
                </div>
              </div>
            </div>

            {/* Main Chat Stream */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl flex flex-col justify-between overflow-hidden shadow-xl">
              {/* Chat Header */}
              <div className="bg-gray-950 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{currentLead.name}</h3>
                    <p className="text-xs text-gray-400">Channel: {currentLead.channel} | Intent Score: {currentLead.intentScore}%</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">Vehicle:</span>
                  <span className="text-xs font-semibold px-2 py-1 bg-gray-800 text-gray-200 rounded font-mono">
                    {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
                  </span>
                </div>
              </div>

              {/* Chat Message History */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-950/40">
                {(conversations[selectedLeadId] || []).map(msg => {
                  const isBuyer = msg.sender === 'BUYER';
                  const isOwner = msg.sender === 'OWNER';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isBuyer ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] text-gray-400 font-medium">{msg.createdAt}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isBuyer ? 'bg-blue-500/20 text-blue-400' : isOwner ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {msg.sender}
                        </span>
                      </div>

                      <div className={`max-w-md p-4 rounded-2xl text-sm leading-relaxed ${
                        isBuyer
                          ? 'bg-gray-800 text-white rounded-tl-none border border-gray-700/60'
                          : isOwner
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-none shadow-lg'
                          : 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20'
                      }`}>
                        {msg.text}
                      </div>

                      {/* Tool Calls Executed by AI Agent */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-2 max-w-md w-full bg-gray-950/90 border border-gray-800 rounded-lg p-2.5 text-xs font-mono space-y-1 text-gray-300">
                          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Bot className="w-3.5 h-3.5" /> Agent Executed Tools ({msg.toolCalls.length})
                          </div>
                          {msg.toolCalls.map((t, idx) => (
                            <div key={idx} className="bg-gray-900/80 p-1.5 rounded border border-gray-800/80">
                              <span className="text-yellow-400 font-semibold">{t.toolName}</span>
                              <div className="text-[10px] text-gray-400 truncate">Args: {JSON.stringify(t.args)}</div>
                              <div className="text-[10px] text-green-400 truncate">Res: {JSON.stringify(t.result)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 bg-gray-950 border-t border-gray-800">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage(chatInput);
                  }}
                  className="flex space-x-2"
                >
                  <input
                    type="text"
                    placeholder="Type simulated buyer message or offer..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-lg font-semibold text-sm flex items-center space-x-2 transition shadow-lg shadow-indigo-600/20"
                  >
                    <span>Send</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* APPOINTMENTS & AUDIT HISTORY VIEW */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Scheduled Appointments & Audit Log</h1>
                <p className="text-sm text-gray-400">Track scheduled buyer test drives and comprehensive AI action logs.</p>
              </div>
            </div>

            {/* Appointments Grid */}
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

                  <div className="bg-gray-950 p-4 rounded-lg border border-gray-800/80 space-y-2 text-sm">
                    <div className="flex items-center text-gray-300 gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-white">{apt.dateTime}</span>
                    </div>
                    <div className="flex items-center text-gray-400 gap-2 text-xs">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span>{currentVehicle.year} {currentVehicle.make} {currentVehicle.model}</span>
                    </div>
                  </div>

                  {apt.notes && (
                    <p className="text-xs text-gray-400 italic">
                      Notes: {apt.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Audit Event History */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> System & AI Agent Audit Events Log
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex justify-between items-center text-gray-300">
                  <span className="text-indigo-400 font-bold">[AGENT_TOOL] evaluate_offer</span>
                  <span className="text-gray-400">Offer $18,000 -&gt; ESCALATE (Below floor $19,500)</span>
                  <span className="text-gray-500 text-[10px]">10:20 AM</span>
                </div>
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex justify-between items-center text-gray-300">
                  <span className="text-green-400 font-bold">[VIN_DECODE] NHTSA_vPIC_API</span>
                  <span className="text-gray-400">Decoded VIN 4T1B11HK5MW123456 (2021 Toyota Camry SE)</span>
                  <span className="text-gray-500 text-[10px]">10:00 AM</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
