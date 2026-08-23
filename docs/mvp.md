# Car Salesman MVP

## Product rule

The owner should be able to enter a VIN, upload one or two photos, set a price floor, and walk away. Car Salesman then operates as the owner's sales employee until a human decision or physical handoff is required.

## State machine

`DRAFT -> READY -> PUBLISHED -> SELLING -> APPOINTMENT -> SOLD`

A vehicle may also enter `ESCALATION_REQUIRED` whenever an action exceeds the agent's authority.

## Owner inputs

- VIN
- 1-2 source photos
- asking price (optional; system can recommend one)
- minimum acceptable price
- optional notes (known defects, title status, location, availability)

## Agent responsibilities

- Decode and normalize the vehicle.
- Produce a factual vehicle profile.
- Analyze source photos.
- Generate listing copy and marketing image prompts/assets.
- Prepare/publish listings through supported marketplace integrations.
- Monitor lead channels where permitted.
- Answer buyer questions using vehicle facts.
- Qualify buyers.
- Negotiate inside the pricing policy.
- Follow up automatically.
- Schedule appointments.
- Escalate to the owner when required.

## Escalation triggers

- Buyer wants to inspect/see the vehicle.
- Offer is below the configured floor.
- Buyer asks for a commitment outside the policy.
- Vehicle information is uncertain or contradictory.
- Marketplace requires a human interaction.
- Agent detects a likely scam or unsafe interaction.

## Pricing policy

The LLM never directly chooses whether an offer can be accepted. It submits a structured offer to the pricing engine.

```text
offer < floor       -> ESCALATE
floor <= offer < target -> COUNTER / ESCALATE according to strategy
target <= offer      -> ACCEPT or COUNTER
```

The owner can later replace this simple policy with a configurable strategy.

## MVP screens

1. Inventory / current vehicle
2. Add vehicle
3. Vehicle dashboard
4. Leads / conversations
5. Offer and negotiation history
6. Appointments
7. Owner action queue
8. Settings / sales policy

## Non-goals for MVP

- Multi-vehicle dealership management
- Financing
- Inventory accounting
- CRM for other salespeople
- Automated title/registration services
- Unapproved marketplace scraping or posting
