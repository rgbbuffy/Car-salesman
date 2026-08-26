import { describe, it, expect, vi } from 'vitest';
import { evaluateOffer } from '../../packages/domain/src/pricing';
import { decodeVin } from '../../packages/domain/src/vin';
import { processBuyerMessage } from '../../packages/domain/src/agent';
import type { SalesPolicy, Vehicle, BuyerLead } from '../../packages/domain/src/types';

describe('Pricing Engine Guardrails', () => {
  const samplePolicy: SalesPolicy = {
    askingPrice: 20000,
    targetPrice: 18000,
    minimumPrice: 15000,
    allowAutomaticAcceptance: true,
    requireOwnerForBelowFloor: true,
    requireOwnerForAppointment: true,
    negotiationIncrement: 500
  };

  it('rejects invalid or negative offer amounts', () => {
    const evalInvalid = evaluateOffer(-500, samplePolicy);
    expect(evalInvalid.decision).toBe('ESCALATE');
    expect(evalInvalid.reason).toContain('invalid');
  });

  it('escalates offers below floor minimum price', () => {
    const evalBelow = evaluateOffer(14000, samplePolicy);
    expect(evalBelow.decision).toBe('ESCALATE');
    expect(evalBelow.reason).toContain('below the owner\'s minimum floor');
  });

  it('counters offers between floor and target price', () => {
    const evalMid = evaluateOffer(16000, samplePolicy);
    expect(evalMid.decision).toBe('COUNTER');
    expect(evalMid.counterAmount).toBeGreaterThanOrEqual(samplePolicy.minimumPrice);
  });

  it('accepts offers equal to or above target price when allowed', () => {
    const evalTarget = evaluateOffer(18500, samplePolicy);
    expect(evalTarget.decision).toBe('ACCEPT');
  });

  it('escalates target-level offers if automatic acceptance is disabled', () => {
    const strictPolicy = { ...samplePolicy, allowAutomaticAcceptance: false };
    const evalStrict = evaluateOffer(18500, strictPolicy);
    expect(evalStrict.decision).toBe('ESCALATE');
    expect(evalStrict.reason).toContain('owner approval is required');
  });
});

describe('VIN Decoder with Provenance', () => {
  it('decodes a valid VIN structure and tags provenance', async () => {
    const result = await decodeVin('4T1B11HK5MW123456');
    expect(result.vin).toBe('4T1B11HK5MW123456');
    expect(result.provenance.length).toBeGreaterThan(0);
    expect(result.provenance[0].source).toBe('NHTSA_vPIC_API');
  });

  it('throws error for invalid VIN format', async () => {
    await expect(decodeVin('SHORT')).rejects.toThrow('Invalid VIN format');
  });
});

describe('Sales Agent Engine & Lead Lifecycle', () => {
  const vehicle: Vehicle = {
    id: 'v1',
    vin: '4T1B11HK5MW123456',
    year: 2021,
    make: 'Toyota',
    model: 'Camry',
    trim: 'SE',
    mileage: 25000,
    status: 'SELLING',
    askingPrice: 20000,
    targetPrice: 18000,
    minimumPrice: 15000,
    notes: 'Single owner, clean title.',
    provenance: [],
    sourcePhotoIds: ['p1'],
    marketingPhotoIds: ['m1']
  };

  const policy: SalesPolicy = {
    askingPrice: 20000,
    targetPrice: 18000,
    minimumPrice: 15000,
    allowAutomaticAcceptance: true,
    requireOwnerForBelowFloor: true,
    requireOwnerForAppointment: true
  };

  const lead: BuyerLead = {
    id: 'l1',
    vehicleId: 'v1',
    name: 'Jane Doe',
    contact: 'jane@example.com',
    channel: 'Website',
    status: 'NEW',
    intentScore: 20
  };

  it('handles below-floor offer by triggering owner escalation', () => {
    const response = processBuyerMessage(lead, vehicle, policy, 'I offer $12,000 cash today', []);
    expect(response.leadStatus).toBe('ESCALATED');
    expect(response.escalation).toBeDefined();
    expect(response.escalation?.reason).toContain('below the owner\'s minimum floor');
    expect(response.replyText).toContain('owner review');
  });

  it('handles appointment request by scheduling tentative slot and escalating if required', () => {
    const response = processBuyerMessage(lead, vehicle, policy, 'I would like to schedule a test drive tomorrow', []);
    expect(response.appointment).toBeDefined();
    expect(response.escalation).toBeDefined();
    expect(response.toolCalls.some(t => t.toolName === 'propose_appointment')).toBe(true);
  });
});
