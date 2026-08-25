import type { NegotiationDecision, SalesPolicy } from "./types";

export interface OfferEvaluation {
  decision: NegotiationDecision;
  reason: string;
  counterAmount?: number;
}

/**
 * Deterministic pricing guardrail. The language model may recommend a response,
 * but it cannot bypass this function.
 */
export function evaluateOffer(
  amount: number,
  policy: SalesPolicy
): OfferEvaluation {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { decision: "ESCALATE", reason: "Offer amount is invalid." };
  }

  // Below floor -> ALWAYS Escalate
  if (amount < policy.minimumPrice) {
    return {
      decision: "ESCALATE",
      reason: `Offer ($${amount.toLocaleString()}) is below the owner's minimum floor price of $${policy.minimumPrice.toLocaleString()}.`,
    };
  }

  // Target price or above
  if (policy.targetPrice !== undefined && amount >= policy.targetPrice) {
    if (policy.allowAutomaticAcceptance) {
      return {
        decision: "ACCEPT",
        reason: `Offer ($${amount.toLocaleString()}) meets or exceeds the target price ($${policy.targetPrice.toLocaleString()}).`,
      };
    }
    return {
      decision: "ESCALATE",
      reason: `Offer ($${amount.toLocaleString()}) meets target price but owner approval is required by policy.`,
    };
  }

  // Between floor and target -> Counter
  const step = policy.negotiationIncrement || 500;
  const asking = policy.askingPrice || policy.targetPrice || policy.minimumPrice * 1.1;

  // Calculate counter offer halfway between buyer offer and asking price, bounded by minimumPrice
  const rawCounter = Math.max(policy.minimumPrice, Math.ceil((asking + amount) / 2 / step) * step);

  return {
    decision: "COUNTER",
    reason: `Offer ($${amount.toLocaleString()}) is above minimum floor ($${policy.minimumPrice.toLocaleString()}) but below asking/target price.`,
    counterAmount: rawCounter,
  };
}
