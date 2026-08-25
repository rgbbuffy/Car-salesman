export type VehicleStatus =
  | "DRAFT"
  | "READY"
  | "PUBLISHED"
  | "SELLING"
  | "APPOINTMENT"
  | "ESCALATION_REQUIRED"
  | "SOLD";

export type NegotiationDecision = "ACCEPT" | "COUNTER" | "DECLINE" | "ESCALATE";

export interface FactProvenance {
  field: string;
  source: "NHTSA_vPIC_API" | "USER_INPUT" | "ESTIMATED" | "SYSTEM";
  value: string | number;
  timestamp: string;
}

export interface Vehicle {
  id: string;
  vin: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyStyle?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  mileage?: number;
  status: VehicleStatus;
  askingPrice?: number;
  targetPrice?: number;
  minimumPrice: number;
  notes?: string;
  provenance: FactProvenance[];
  sourcePhotoIds: string[];
  marketingPhotoIds: string[];
}

export interface BuyerLead {
  id: string;
  vehicleId: string;
  name?: string;
  contact?: string;
  channel: string;
  status: "NEW" | "QUALIFYING" | "SERIOUS" | "APPOINTMENT" | "CLOSED" | "ESCALATED";
  intentScore: number;
  lastMessageAt?: string;
}

export interface ConversationMessage {
  id: string;
  leadId: string;
  sender: "BUYER" | "AGENT" | "OWNER";
  text: string;
  createdAt: string;
  toolCalls?: AgentToolCall[];
}

export interface AgentToolCall {
  toolName: string;
  args: Record<string, any>;
  result: any;
  timestamp: string;
}

export interface Offer {
  id: string;
  leadId: string;
  amount: number;
  currency: "USD";
  decision: NegotiationDecision;
  reason: string;
  createdAt: string;
}

export interface SalesPolicy {
  askingPrice?: number;
  targetPrice?: number;
  minimumPrice: number;
  allowAutomaticAcceptance: boolean;
  requireOwnerForBelowFloor: boolean;
  requireOwnerForAppointment: boolean;
  negotiationIncrement?: number;
}

export interface Appointment {
  id: string;
  vehicleId: string;
  leadId: string;
  buyerName: string;
  buyerContact: string;
  dateTime: string;
  location: string;
  status: "REQUESTED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes?: string;
}

export interface OwnerEscalation {
  id: string;
  leadId: string;
  vehicleId: string;
  reason: string;
  intentScore: number;
  currentAskingPrice: number;
  minimumPrice: number;
  latestOffer?: number;
  recommendedAction: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "COUNTERED";
  createdAt: string;
}
