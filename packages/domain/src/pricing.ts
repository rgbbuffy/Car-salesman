import type { NegotiationDecision, SalesPolicy } from "./types";

export interface OfferEvaluation {
  decision: NegotiationDecision;
  reason: string;
}

/**
 * Deterministic pricing guardrail. The language model may recommend a response,
 * but it cannot bypass this function.
 */
export function evaluateOffer(
  amount: number,
  policy: SalesPolicy,
): OfferEvaluation {
  if (!Number.isFinite(amount) || amount < 0) {
    return { decision: "ESCALATE", reason: "Offer amount is invalid." };
  }

  if (amount < policy.minimumPrice) {
    return {
      decision: "ESCALATE",
      reason: `Offer is below the owner's minimum price of $${policy.minimumPrice.toLocaleString()}.`,
    };
  }

  if (policy.targetPrice !== undefined && amount >= policy.targetPrice) {
    if (policy.allowAutomaticAcceptance) {
      return { decision: "ACCEPT", reason: "Offer meets or exceeds the target price." };
    }
    return { decision: "ESCALATE", reason: "Offer meets target but owner approval is required." };
  }

  return { decision: "COUNTER", reason: "Offer is authorized but below target." };
}
