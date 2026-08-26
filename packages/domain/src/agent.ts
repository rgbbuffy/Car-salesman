import type { BuyerLead, Vehicle, SalesPolicy, ConversationMessage, AgentToolCall, OwnerEscalation, Appointment } from "./types";
import { evaluateOffer } from "./pricing";

export interface SalesAgentResponse {
  replyText: string;
  leadStatus: BuyerLead["status"];
  intentScore: number;
  toolCalls: AgentToolCall[];
  escalation?: OwnerEscalation;
  appointment?: Appointment;
}

/**
 * LLM API Integration Connection Point
 * ------------------------------------
 * To connect a real commercial LLM API (e.g. OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet):
 * 1. Read process.env.OPENAI_API_KEY or settings.openaiApiKey.
 * 2. Invoke the LLM with system prompt + vehicle specs + sales policy rules.
 * 3. Pass agent tools (`get_vehicle`, `evaluate_offer`, `create_owner_escalation`, `propose_appointment`).
 * 4. Execute tool calls and enforce deterministic `evaluateOffer` guardrail.
 */
export function processBuyerMessage(
  lead: BuyerLead,
  vehicle: Vehicle,
  policy: SalesPolicy,
  userMessageText: string,
  history: ConversationMessage[]
): SalesAgentResponse {
  const toolCalls: AgentToolCall[] = [];
  const timestamp = new Date().toISOString();
  let intentScore = lead.intentScore || 20;
  let leadStatus = lead.status;
  let escalation: OwnerEscalation | undefined = undefined;
  let appointment: Appointment | undefined = undefined;

  const lowerText = userMessageText.toLowerCase();

  // Tool Call execution: get_vehicle fact lookup
  toolCalls.push({
    toolName: "get_vehicle",
    args: { vehicleId: vehicle.id, vin: vehicle.vin },
    result: { make: vehicle.make, model: vehicle.model, year: vehicle.year, status: vehicle.status },
    timestamp
  });

  // Offer detection
  const offerMatch = userMessageText.match(/\$?(\d{1,3}(?:,\d{3})*|\d{4,6})/);
  const isOfferContext = lowerText.includes("offer") || lowerText.includes("give you") || lowerText.includes("take") || lowerText.includes("pay") || offerMatch !== null;

  if (isOfferContext && offerMatch) {
    const numericValue = parseInt(offerMatch[1].replace(/,/g, ''), 10);
    if (numericValue > 1000 && numericValue !== vehicle.year) {
      intentScore = Math.max(intentScore, 75);
      leadStatus = "SERIOUS";

      toolCalls.push({
        toolName: "evaluate_offer",
        args: { leadId: lead.id, amount: numericValue, policy },
        result: evaluateOffer(numericValue, policy),
        timestamp
      });

      const evalResult = evaluateOffer(numericValue, policy);

      if (evalResult.decision === "ACCEPT") {
        return {
          replyText: `Great news! Your offer of $${numericValue.toLocaleString()} is accepted! When would you like to schedule your appointment to finalize the deal and pick up your ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}?`,
          leadStatus: "SERIOUS",
          intentScore: 95,
          toolCalls
        };
      } else if (evalResult.decision === "COUNTER") {
        return {
          replyText: `Thank you for your offer of $${numericValue.toLocaleString()}. While we can't accept that price directly, our target price is $${(policy.askingPrice || policy.targetPrice || vehicle.minimumPrice * 1.1).toLocaleString()}. We could do $${evalResult.counterAmount?.toLocaleString() || policy.targetPrice?.toLocaleString()}. Would you be ready to come in for a test drive at that price?`,
          leadStatus: "SERIOUS",
          intentScore: 80,
          toolCalls
        };
      } else { // ESCALATE
        leadStatus = "ESCALATED";
        escalation = {
          id: `esc_${Date.now()}`,
          leadId: lead.id,
          vehicleId: vehicle.id,
          reason: evalResult.reason,
          intentScore,
          currentAskingPrice: policy.askingPrice || vehicle.askingPrice || 0,
          minimumPrice: policy.minimumPrice,
          latestOffer: numericValue,
          recommendedAction: numericValue < policy.minimumPrice ? `Counter at floor price $${policy.minimumPrice.toLocaleString()} or decline.` : "Review buyer offer.",
          status: "PENDING",
          createdAt: timestamp
        };

        toolCalls.push({
          toolName: "create_owner_escalation",
          args: { leadId: lead.id, reason: evalResult.reason, amount: numericValue },
          result: { escalationId: escalation.id },
          timestamp
        });

        return {
          replyText: `Thank you for your offer of $${numericValue.toLocaleString()}. Because this offer requires owner review, I have submitted it directly to the owner for immediate consideration. I will follow up with you as soon as they review it!`,
          leadStatus: "ESCALATED",
          intentScore: 85,
          toolCalls,
          escalation
        };
      }
    }
  }

  // Appointment detection
  if (lowerText.includes("appointment") || lowerText.includes("see the car") || lowerText.includes("test drive") || lowerText.includes("inspect") || lowerText.includes("meet")) {
    intentScore = Math.max(intentScore, 85);
    leadStatus = "APPOINTMENT";

    appointment = {
      id: `apt_${Date.now()}`,
      vehicleId: vehicle.id,
      leadId: lead.id,
      buyerName: lead.name || "Interested Buyer",
      buyerContact: lead.contact || "Via Chat",
      dateTime: "Tomorrow at 2:00 PM",
      location: "Main Dealership Lot / Owner Location",
      status: "REQUESTED",
      notes: "Buyer requested test drive / inspection"
    };

    toolCalls.push({
      toolName: "propose_appointment",
      args: { leadId: lead.id, vehicleId: vehicle.id },
      result: { appointmentId: appointment.id, slot: appointment.dateTime },
      timestamp
    });

    if (policy.requireOwnerForAppointment) {
      escalation = {
        id: `esc_${Date.now()}`,
        leadId: lead.id,
        vehicleId: vehicle.id,
        reason: "Buyer requested test drive / physical inspection",
        intentScore: 90,
        currentAskingPrice: policy.askingPrice || vehicle.askingPrice || 0,
        minimumPrice: policy.minimumPrice,
        recommendedAction: "Confirm appointment time and location with buyer.",
        status: "PENDING",
        createdAt: timestamp
      };

      toolCalls.push({
        toolName: "create_owner_escalation",
        args: { leadId: lead.id, reason: "Appointment request requires owner approval" },
        result: { escalationId: escalation.id },
        timestamp
      });
    }

    return {
      replyText: `I would be happy to schedule a test drive for you! I have reserved a tentative slot for Tomorrow at 2:00 PM. Our owner will confirm the physical access details shortly. Does that time work for you?`,
      leadStatus: policy.requireOwnerForAppointment ? "ESCALATED" : "APPOINTMENT",
      intentScore: 90,
      toolCalls,
      escalation,
      appointment
    };
  }

  return {
    replyText: `Thank you for inquiring about the ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || 'vehicle'}. Asking price is $${(policy.askingPrice || vehicle.askingPrice || 0).toLocaleString()}. Would you like to check available features, make an offer, or schedule a test drive?`,
    leadStatus: leadStatus === "NEW" ? "QUALIFYING" : leadStatus,
    intentScore: intentScore + 5,
    toolCalls
  };
}
