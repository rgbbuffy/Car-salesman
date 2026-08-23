# Car Salesman — Product Specification

## 1. Mission

Create an AI sales agent that behaves like an exceptionally persistent, knowledgeable vehicle salesperson while remaining strictly inside owner-defined authority.

The owner should spend time only on decisions that require a human: physically showing the vehicle, approving exceptional pricing, handling unusual situations, and closing the deal.

## 2. Owner control model

Each vehicle has a **Sales Policy**:

- Asking price
- Target price
- Minimum price / walk-away floor
- Negotiation increment
- Maximum discount without approval
- Financing/trade-in behavior
- Appointment availability
- Required owner approval events
- Allowed claims/features
- Advertising budget and channel permissions

The agent can autonomously negotiate down to the configured floor. Any offer below the floor becomes an escalation rather than an acceptance.

## 3. Lead lifecycle

`NEW → ENGAGED → QUALIFIED → SERIOUS → APPOINTMENT_REQUESTED → APPOINTMENT_SET → OWNER_REQUIRED → CLOSED / LOST`

A lead becomes **SERIOUS** when signals such as these occur:

- Buyer asks for a specific appointment time.
- Buyer asks whether the vehicle is still available and follows with purchase-intent questions.
- Buyer provides a serious offer.
- Buyer asks to inspect/test-drive the vehicle.
- Buyer indicates they are ready to buy subject to inspection.

## 4. Escalation packet

When owner action is required, show:

- Vehicle
- Buyer name/contact
- Conversation summary
- Buyer intent score
- Current asking price
- Lowest authorized price
- Latest offer
- Recommended counteroffer
- Reason escalation occurred
- Appointment details
- One-tap actions: approve, counter, decline, reschedule, contact buyer

## 5. Vehicle ingestion

VIN entry should create a canonical vehicle record. The system should use licensed/authorized providers for decoding, specifications, history and market data.

Store provenance for every important vehicle fact so the UI can show where the fact came from.

Required initial fields:

- VIN
- Year
- Make
- Model
- Trim
- Body style
- Engine
- Transmission
- Drivetrain
- Mileage
- Exterior/interior description
- Equipment/features
- Title/status information when legally available
- Owner-entered condition notes
- Purchase cost
- Asking/target/floor pricing

## 6. Media strategy

There are two separate classes of imagery:

**Documentary media** — actual photos of the vehicle. Never alter them in a way that could misrepresent condition.

**Marketing media** — AI-generated compositions derived from source photos, used for backgrounds, crops, lifestyle compositions, detail concepts, and other advertising assets. Generated media must be labeled/handled according to the destination platform's rules and must not fabricate material vehicle features or condition.

The initial release should prioritize excellent listing copy and photo organization before full synthetic-angle generation.

## 7. Sales agent tools

The AI agent should have explicit tools rather than unrestricted access:

- `get_vehicle`
- `get_price_policy`
- `calculate_offer`
- `create_lead`
- `update_lead`
- `send_message`
- `find_appointment_slots`
- `book_appointment`
- `cancel_appointment`
- `escalate_to_owner`
- `create_listing_draft`
- `get_market_snapshot`

Every tool call should be logged.

## 8. Negotiation engine

Do not let the language model directly decide whether an offer is acceptable.

Instead:

1. LLM extracts buyer intent and proposed terms into structured data.
2. Deterministic policy engine evaluates the offer.
3. Policy engine returns `ACCEPT`, `COUNTER`, `DECLINE`, or `ESCALATE`.
4. LLM turns that decision into natural sales language.

This separation is critical because pricing authority belongs to the owner, not the model.

## 9. Advertising engine

The advertising system should maintain channel adapters. Each adapter supports only actions that the channel permits.

Example capabilities:

- create listing draft
- publish
- update listing
- retrieve leads
- respond to lead
- pause listing
- retrieve basic performance metrics

If a platform does not permit an automated action, the system creates an owner task instead of attempting to bypass the platform.

## 10. Appointment engine

Appointments should have:

- date/time
- location
- vehicle
- buyer
- status
- confirmation status
- reminders
- owner visibility

The agent may schedule within owner-defined availability. The owner receives an immediate notification for a serious buyer and for appointments requiring physical vehicle access.

## 11. Dashboard

Primary screens:

1. **Today** — appointments, urgent leads, tasks and sales opportunities.
2. **Vehicles** — inventory and pricing policies.
3. **Leads** — conversations and intent/offer status.
4. **Sales Agent** — live agent activity and intervention controls.
5. **Listings** — channel status and drafts.
6. **Media** — documentary vs generated assets.
7. **Analytics** — inquiries, response rate, appointments, offers, sales and time-to-sale.
8. **Settings** — owner identity, notifications, channels, AI behavior and policy defaults.

## 12. MVP acceptance criteria

A user can:

- Create a vehicle using a VIN.
- Review imported vehicle facts and their source.
- Upload source photos.
- Set asking/target/floor price.
- Have the agent conduct a simulated buyer conversation.
- Make an offer and receive a policy-compliant response.
- Trigger an owner escalation.
- Schedule an appointment.
- See the complete audit history.

No marketplace account credentials should be stored in plaintext, and no automated workflow should attempt to circumvent platform restrictions.
