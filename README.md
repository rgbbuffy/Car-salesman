# Car Salesman

An AI-powered vehicle sales agent designed to market vehicles, qualify and negotiate with buyers, schedule appointments, and escalate only high-value decisions to the owner.

## Product vision

**Car Salesman** is not a chatbot bolted onto a listing. It is an autonomous sales workflow with a human owner as the final authority.

### Core workflow

1. Add a vehicle by VIN.
2. Import verified vehicle specifications and history from authorized data providers.
3. Add one or two source photos.
4. Generate listing-ready marketing assets from the source imagery, clearly distinguishing generated imagery from documentary photos.
5. Create pricing rules: asking price, target price, minimum acceptable price, and escalation rules.
6. Publish or prepare listings for supported marketplaces and channels.
7. Respond to leads, answer questions, qualify buyers, and negotiate within configured limits.
8. Schedule appointments automatically.
9. Escalate when a buyer is serious, requests an owner-only decision, wants to see the vehicle, or proposes a price below the configured threshold.
10. Notify the owner with the complete conversation, buyer profile, vehicle details, offer, and recommended action.

## Important guardrails

- VIN and vehicle facts must come from authoritative or licensed data sources; never invent specifications.
- Generated images must not misrepresent the actual condition or equipment of the vehicle. Documentary photos should remain clearly identified.
- The agent may negotiate only inside owner-defined rules.
- The agent cannot accept a below-floor offer, promise unavailable features, or make commitments outside its authority.
- Marketplace automation must use permitted APIs or supported workflows and respect each platform's terms.
- Personal data and customer communications should be stored securely with role-based access and audit logs.

## Proposed architecture

- **Frontend:** Next.js + TypeScript
- **Backend:** TypeScript service/API
- **Database:** PostgreSQL
- **Queue/workflows:** Redis + a durable workflow layer
- **AI:** LLM with tool calling and structured outputs
- **Vehicle data:** licensed VIN decoder/history/pricing providers
- **Images:** image-generation service for marketing concepts; original photos preserved as source-of-truth
- **Notifications:** SMS/email/push
- **Scheduling:** calendar integration
- **Observability:** structured logs, audit events, error tracking

## Suggested repository structure

```text
apps/
  web/                 # owner dashboard + lead inbox
  api/                 # backend API
packages/
  domain/              # vehicle, lead, negotiation and policy models
  ai/                  # prompts, tools, agent policies
  vehicle-data/       # VIN/provider adapters
  marketplace/         # marketplace adapters
  media/               # image processing/generation
  scheduling/          # appointment/calendar integrations
  notifications/       # SMS/email/push adapters
  db/                  # schema and migrations
  config/              # shared configuration
  ui/                  # reusable UI components

infra/
  docker/
  migrations/
docs/
  architecture.md
  product-spec.md
```

## First milestone

Build the **single-vehicle sales cockpit** before marketplace automation:

- VIN entry and vehicle record
- source-photo upload
- pricing policy editor
- AI sales agent with conversation history
- lead qualification
- offer/negotiation engine
- appointment scheduling
- owner escalation inbox
- complete audit trail

Marketplace publishing, broad advertising automation, and generated-image expansion should be added after the core sales loop is reliable.
