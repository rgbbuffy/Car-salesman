export type VehicleStatus =
  | "DRAFT"
  | "READY"
  | "PUBLISHED"
  | "SELLING"
  | "APPOINTMENT"
  | "ESCALATION_REQUIRED"
  | "SOLD";

export type NegotiationDecision = "ACCEPT" | "COUNTER" | "DECLINE" | "ESCALATE";

export interface Vehicle {
  id: string;
  vin: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number;
  status: VehicleStatus;
  askingPrice?: number;
  targetPrice?: number;
  minimumPrice: number;
  notes?: string;
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
  lastMessageAt?: string;
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
}
