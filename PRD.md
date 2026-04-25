# District Cover — Insurance Readiness Platform
## Product Requirements Document (PRD)
**Version:** 1.0
**Last Updated:** April 25, 2026
**Status:** Finalized for Phase 1 Build

---

## Legend
- ✅ Decided / Resolved
- ⚠️ Designed / Not Yet Built
- ❌ Out of Scope / Parked
- 🔲 Open Question / Needs Decision

---

## Table of Contents
1. [Problem Statement](#1-problem-statement)
2. [Industry Context](#2-industry-context)
3. [Who This Is For](#3-who-this-is-for)
4. [Solution Overview](#4-solution-overview)
5. [User Flows](#5-user-flows)
6. [Feature Specifications](#6-feature-specifications)
7. [Submission Lifecycle](#7-submission-lifecycle)
8. [ACORD 125 Field Mapping](#8-acord-125-field-mapping)
9. [Insurance Readiness Score](#9-insurance-readiness-score)
10. [Broker Export Package](#10-broker-export-package)
11. [Build Phases](#11-build-phases)
12. [Decisions Log](#12-decisions-log)
13. [Open Questions](#13-open-questions)
14. [Implementation References](#14-implementation-references)

---

## 1. Problem Statement

Urban small businesses in San Francisco are not inherently uninsurable — they are **misunderstood**. Risk is assessed at a ZIP code level, improvements go undocumented, and business owners have no visibility into what's blocking their coverage or raising their premiums.

Meanwhile:
- Brokers spend **45–90 minutes per new client** on manual ACORD intake via phone calls and email chains
- MGAs like District Cover receive **incomplete submissions** that slow underwriting and force back-and-forth
- Good businesses get **declined or overpriced** not because they are risky, but because their risk story is invisible

**Result: Good SF businesses get left behind.**

---

## 2. Industry Context

### How the Industry Works

```
Business Owner → Broker → District Cover (Program Admin / Surplus Lines Broker) → Vantage Risk (Carrier)
```

| Party | Role | Legal Responsibility |
|---|---|---|
| **Business Owner** | Wants coverage | Provide accurate information |
| **Broker** | Licensed intermediary | Acts in business's best interest. Signs and is responsible for the ACORD 125 submission. |
| **District Cover** | Licensed surplus lines broker + program administrator | Proprietary underwriting models for city-based risk. Works through broker partners. Backed by Vantage Risk. |
| **Vantage Risk** | Carrier | Holds financial risk. Pays claims. |

### Key Facts About District Cover
- ✅ Licensed insurance producer and surplus lines broker (CA License #6008928)
- ✅ **Non-admitted** commercial insurance product — can cover businesses the standard admitted market declines
- ✅ Backed by a16z, Amwins, Vantage Risk, Impact America Fund among others
- ✅ Already has a broker-facing platform (Insly-based): `districtcover.app.us.insly.com`
- ✅ Carrier / underwriter: **Vantage Risk Specialty Insurance Company**

### What "Non-Admitted" Means for This Product
District Cover operates in the **surplus lines market** — where hard-to-place, complex, or underserved risks go. This gives them flexibility on pricing and policy terms that admitted carriers don't have. This is exactly why they can serve urban SF small businesses that others decline. Your product feeds their pipeline with better-documented, better-understood risk profiles.

### The Broker's Economic Reality
Brokers are paid via **commission from the carrier** (~10–15% of premium). For a small commercial account with a $3,000 annual premium, that's $300–450. A 90-minute manual intake call is economically marginal. Many brokers quietly deprioritize small commercial because the math doesn't work. **This product makes small commercial accounts profitable for brokers again** by collapsing intake from 90 minutes to 15 minutes of review.

---

## 3. Who This Is For

### Primary Users

| User | Description | Core Pain |
|---|---|---|
| **Business Owner** | SF small business operator. May be first-generation immigrant, non-insurance-savvy, time-poor. Interacts via Telegram bot. | No visibility into what's blocking coverage. Can't navigate insurance language. Doesn't know what to fix. |
| **Broker** | Licensed insurance professional managing a book of commercial clients. Interacts via web dashboard. | Manual intake is time-consuming and unprofitable for small accounts. |

### Secondary Users

| User | Description | Value Received |
|---|---|---|
| **District Cover** | Receives broker-submitted dossiers. Reviews and underwrites. | Complete, structured, ACORD-aligned submissions instead of blank forms. Better risk visibility. |
| **Vantage Risk** | Financial backer. No direct product interaction. | Better risk data leads to better pricing and fewer surprises at claims time. |

### Geographic Scope
✅ **San Francisco only** — Phase 1.

Priority neighborhoods: Tenderloin, SoMa, Mission District, Chinatown, Sunset / Richmond, Bayview-Hunters Point

### Language
✅ **English only** — Keep it simple.

---

## 4. Solution Overview

A **Telegram-based intake and advisory bot** for business owners, paired with a **broker-facing web dashboard** for review, tracking, and submission.

### Core Value Proposition — Priority Order

This is what the product is actually about, ranked by impact:

```
┌──────────────────────────────────────────────────────────────────┐
│  1. NON-PUBLIC DATA  ← The primary differentiator               │
│  Photos, documents, owner-submitted info underwriters can't see. │
│  Roof condition, alarm contracts, sprinkler certificates,        │
│  electrical panels — this is what changes a decline to an        │
│  approval. Nobody in the current system is collecting this.      │
├──────────────────────────────────────────────────────────────────┤
│  2. EXPLAINABILITY                                               │
│  Why were you declined? What does your score mean? What should   │
│  you fix first and why? Plain English at every step.             │
│  Transparency that doesn't exist anywhere in the industry today. │
├──────────────────────────────────────────────────────────────────┤
│  3. ADVISORY                                                     │
│  Data-backed answers to coverage questions via Telegram.         │
│  Meets the business owner where they are.                        │
├──────────────────────────────────────────────────────────────────┤
│  4. UI/UX                                                        │
│  Telegram bot replaces a confusing phone call and paper form.    │
│  Broker dashboard replaces manual email chains.                  │
├──────────────────────────────────────────────────────────────────┤
│  5. PUBLIC DATA  ← Supporting context only                      │
│  A few simple SF data signals show the system is contextually    │
│  aware. Not the point — supporting evidence for the score.       │
└──────────────────────────────────────────────────────────────────┘
```

### What This Product Is NOT
- ❌ Does not replace the broker — broker reviews and submits everything
- ❌ Does not issue policies — that is District Cover + Vantage Risk
- ❌ Does not give legal insurance advice — gives curated, data-backed guidance
- ❌ Does not integrate with carriers directly — feeds the broker → MGA chain

---

## 5. User Flows

### Flow A — Broker Initiates Intake (Primary Flow) ⚠️

```
1. Broker logs into web dashboard
2. Broker clicks "New Client"
3. Broker fills in: Business name, owner name, owner contact info
4. Dashboard generates a unique Telegram deep link
   → Format: t.me/DistrictCoverBot?start={unique_token}
   → Token ties conversation to broker account + client record
5. Broker copies link and sends to business owner
   (via text, email, WhatsApp — broker's choice, outside the platform)
6. Business owner clicks link → Telegram opens
7. Bot greets owner by name, explains what it will do, starts intake
8. Owner answers questions conversationally, uploads photos/docs
9. Owner can exit and resume — progress is saved per session token
10. When intake is complete → broker receives dashboard notification
11. Broker reviews dossier in dashboard
12. Broker selects MGA to submit to (District Cover or other)
13. Broker exports ACORD-aligned package and submits
14. Broker updates submission status in dashboard
```

---

### Flow B — Business Owner Advisory (Invited Users Only) ⚠️

```
1. Business owner has completed intake (has active bot session)
2. Owner messages the bot with a coverage question at any time
   e.g. "Am I covered if a fire starts in the unit next to mine?"
3. Bot responds with a curated, plain-English answer from template library
4. Bot cross-references their intake data to personalize the answer
   e.g. "Based on what you told me, you have a tenant policy but no
   business interruption coverage. Here's what that means for you..."
5. Bot surfaces relevant checklist items if the question reveals a gap
6. Owner can ask follow-up questions in the same thread
```

**Advisory Answer Format — Data-Backed Statistics (not free-form LLM)**

Each advisory answer is a curated template anchored to a published statistic. This makes guidance more credible, more actionable, and avoids the legal risk of giving unsupported coverage opinions.

Example format:
> *"Businesses with monitored alarm systems experience 60% fewer successful burglary claims on average (Insurance Information Institute). Installing one is one of the highest-ROI steps you can take for your premium. Here's how to get started..."*

**Data sources for advisory templates:**
| Source | URL | What It Provides |
|---|---|---|
| Insurance Information Institute | [iii.org](https://www.iii.org) | Loss statistics by risk factor, premium impact data |
| NFPA | [nfpa.org](https://www.nfpa.org) | Fire suppression and sprinkler effectiveness data |
| SF Open Data / FBI Crime Data | [data.sfgov.org](https://data.sfgov.org) | Burglary reduction by security measure, SF-specific |
| FEMA / IBHS | [ibhs.org](https://www.ibhs.org) | Property resilience data, risk mitigation effectiveness |

The implementing agent should pull relevant statistics from these sources and embed them into advisory templates before Phase 2 ships. Each template answer should cite its source.

---

### Flow C — Business Owner Score & Checklist View ⚠️

```
1. After intake is complete, bot sends owner their Readiness Score
2. Bot explains each sub-score in plain English
3. Bot sends prioritized action checklist
   → Each item: what it is, why it matters, how to complete it, estimated impact
4. Owner can message bot to mark items as complete
5. Score updates in real time as items are completed and verified
6. Owner can check their score and checklist at any time:
   "What's my score?" or "Show my checklist"
```

---

### Flow D — Submission Lifecycle Tracking ⚠️

```
Intake Complete → Broker Reviewed → Submitted to MGA → Quote Received → Bound / Declined
```

- Broker manually advances each stage (except "Intake Complete" which is automatic)
- Dashboard shows all clients across stages as a pipeline/Kanban view
- Each stage change is timestamped
- If Declined: broker adds reason → translated to plain English → fed back to owner as new checklist items

---

### Flow E — Renewal Mode ❌ Phase 3+

```
1. System tracks policy expiration date (entered by broker at binding)
2. 90 days before expiration → bot proactively messages owner
3. Bot asks only what has changed since last intake
4. Updates only changed ACORD fields — does not repeat full intake
5. Broker gets renewal dossier delta for review
```

---

## 6. Feature Specifications

### 6.1 Telegram Bot

**Platform:** Telegram Bot API
**Reference Implementation:** [Lendica ERP Data Ingestion Bot](https://github.com/Lendica-PlayGround/erp-data-ingestion/tree/main)
→ Use as inspiration for: conversational intake flow design, session management, question sequencing patterns, and how to handle structured data collection via chat. The implementing agent should read this repo before building the bot.

| Feature | Description | Phase |
|---|---|---|
| ✅ Deep link initiation | Unique token per client, ties conversation to broker + client record | 1 |
| ✅ Resume-able sessions | Owner can exit and return, progress is saved per token | 1 |
| ✅ Conversational intake | One question at a time, plain English, no form feel | 1 |
| ✅ Photo upload | Owner sends photos, bot confirms receipt and labels them | 1 |
| ✅ Document upload | Owner sends PDFs (inspection reports, contracts), bot labels and stores | 1 |
| ⚠️ AI photo verification | Claude Vision reviews uploads, confirms what's present, updates score — no human in loop | 2 |
| ⚠️ Advisory Q&A | Curated template answers to coverage questions, personalized using intake data | 2 |
| ⚠️ Score delivery | Bot sends readiness score after intake completes | 2 |
| ⚠️ Checklist delivery | Bot sends prioritized action items after intake | 2 |
| ⚠️ Checklist updates | Owner marks items complete via bot, score updates | 2 |
| ❌ Proactive renewal ping | Bot messages owner 90 days before expiration | 3+ |

**Bot Personality:**
- English only ✅
- Plain English — no jargon without an immediate explanation
- One question at a time — never overwhelm
- Non-judgmental about prior claims, cancellations, or violations
- When insurance terms appear: *"Your GL policy — that's General Liability, which covers injuries to customers or damage to their property — asks about..."*

**Photo Verification (Phase 2 — AI, No Human in Loop):**
- Owner uploads photo (fire extinguisher, electrical panel, security camera, etc.)
- Claude Vision analyzes the image and confirms: what is present, any visible issues, whether the tag/date is readable
- Bot responds confirming verification or requests a better photo
- Verified items automatically update the readiness score

---

### 6.2 Broker Web Dashboard

**Integration Target:** District Cover's existing Insly-based platform (`districtcover.app.us.insly.com`)
**Phase 1:** Standalone web dashboard
**Phase 2:** Mock UI showing how Insly integration works (built for hackathon demo)
**Phase 3:** Live API integration with Insly

| View | Description | Phase |
|---|---|---|
| ⚠️ Client List | All clients, readiness score, current pipeline stage | 1 |
| ⚠️ New Client | Form: add client + generate Telegram deep link | 1 |
| ⚠️ Client Detail | Full dossier: ACORD fields, documents, score breakdown, checklist | 1 |
| ⚠️ Export | Generate PDF broker export package per client | 1 |
| ⚠️ Pipeline / Kanban | All clients across submission lifecycle stages | 2 |
| ⚠️ MGA Routing | Select which MGA(s) to submit to from dashboard | 2 |
| ❌ Building View | Group clients by shared address, flag group eligibility | Parked |

**Broker Actions:**

| Action | Phase |
|---|---|
| ⚠️ Create new client → generate Telegram link | 1 |
| ⚠️ View client dossier (ACORD fields + uploads + score) | 1 |
| ⚠️ Export ACORD-aligned PDF | 1 |
| ⚠️ Advance submission pipeline stage manually | 2 |
| ⚠️ Add notes / annotations to dossier | 2 |
| ⚠️ Select MGA and log submission | 2 |
| ⚠️ Log quote received / bound / declined outcome | 2 |
| ❌ Direct API submission to Insly | 3 |

---

### 6.3 Insly Integration (District Cover's Platform)

| Phase | Approach |
|---|---|
| Phase 1 | ❌ No integration. PDF export only. Broker manually uploads to Insly. |
| Phase 2 | ⚠️ Mock UI — build a webpage that visually mirrors the Insly/District Cover broker portal. Show a "Submit to District Cover" button that populates a pre-filled form from dossier data. Demonstrates integration without live API access. |
| Phase 3 | ⚠️ Live API integration — broker submits directly from dashboard into Insly. |

---

### 6.4 SF Public Data Layer ⚠️ Phase 2 — Supporting Context Only

**Purpose:** Show the system is contextually aware of SF. Not the core feature — just supporting signal for the neighborhood dimension of the score. Keep implementation simple.

Pull 2–3 signals maximum:

| Signal | Source | Use |
|---|---|---|
| Recent fire incidents near address | [SF Open Data — Fire](https://data.sfgov.org/Public-Safety/Fire-Incidents/wr8u-xric) | Proximate risk flag — neutralized when business has documented mitigations |
| Open building code violations at address | [SF DBI](https://www.sf.gov/departments/department-building-inspection) | Hard flag — surfaces if there's an uncorrected violation at the property |
| Flood zone designation | [FEMA Flood Map](https://msc.fema.gov/portal/home) | Triggers a note to consider flood/inland marine coverage |

**Do not over-engineer this.** The public data layer exists to demonstrate contextual awareness and support the proximate risk neutralization story. The non-public data, explainability, and advisory are the product.

**Proximate Risk Neutralization:**
If a nearby fire is flagged AND the business has uploaded a sprinkler certificate + alarm contract, auto-generate this statement for the broker export:

> *"A structure fire occurred within 2 blocks of this property in [month/year]. This business has documented fire suppression (last inspected [date]) and a monitored alarm system ([provider]). This business should not face coverage drops or penalties based on this incident."*

---

### 6.5 Group Insurance Module ❌ Parked — Phase 4

Businesses in the same building or community share correlated physical risk. A group policy structure could reduce individual premiums by acknowledging shared exposure.

**Questions to resolve before building:**
- 🔲 Same-building (landlord-anchored) or BID/block-level (association-anchored)?
- 🔲 Who is the legal anchor for the group policy?
- 🔲 How does the broker manage a group vs. individual submission?
- 🔲 At what threshold does group eligibility trigger (e.g., 3+ businesses at same address)?

---

## 7. Submission Lifecycle

### Pipeline Stages ⚠️ Phase 2

```
┌──────────────────┐   ┌──────────────────┐   ┌───────────────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│  1. INTAKE       │ → │  2. BROKER       │ → │  3. SUBMITTED TO MGA  │ → │  4. QUOTE        │ → │  5. OUTCOME          │
│  COMPLETE        │   │  REVIEWED        │   │                       │   │  RECEIVED        │   │  BOUND / DECLINED    │
│                  │   │                  │   │                       │   │                  │   │                      │
│  Auto-triggered  │   │  Broker manually │   │  Broker logs MGA      │   │  Broker logs     │   │  Broker logs         │
│  when bot marks  │   │  marks as        │   │  name + submission    │   │  quote + premium │   │  outcome + reason    │
│  intake complete │   │  reviewed        │   │  date                 │   │                  │   │                      │
└──────────────────┘   └──────────────────┘   └───────────────────────┘   └──────────────────┘   └──────────────────────┘
```

### Stage Definitions

| Stage | Trigger | Broker Action | Business Owner Gets |
|---|---|---|---|
| **Intake Complete** | Bot marks all required fields answered | Review notification sent to broker | Bot confirms: "Your intake is complete. Your broker will review shortly." |
| **Broker Reviewed** | Broker clicks "Mark Reviewed" | Annotate, flag gaps, generate export | No change |
| **Submitted to MGA** | Broker logs MGA + submission date | Upload export or submit via Insly | No change |
| **Quote Received** | Broker logs quote + premium | Present quote to business | Bot: "Your broker received a quote for your business." |
| **Bound** | Broker confirms policy bound | Log policy number + expiration date | Bot: "You're covered! Policy expires [date]." Renewal countdown starts. |
| **Declined** | Broker logs decline + reason | Reason translated → plain English | Bot: "Here's why you were declined and what you can do about it." + updated checklist |

### Decline Feedback Loop
When a submission is declined:
1. Broker enters decline reason (underwriting cause, missing info, risk class, etc.)
2. System translates reason into plain English
3. Bot messages owner explaining the decline without jargon
4. System generates new checklist action items based on decline reason
5. Owner works through items; can trigger a new intake cycle when ready

---

## 8. ACORD 125 Field Mapping

**Reference Form:** [ACORD 125 Commercial Insurance Application (2016/03)](https://www.firstchoiceii.com/pdf/Acord125CommInsApp.pdf)

Every bot question maps to an ACORD 125 field or a direct underwriting purpose. No question is asked without a clear reason. The implementing agent should download and read the ACORD 125 PDF before building the intake question sequence.

---

### Section A — Applicant Identity (ACORD Page 1)

| Bot Question | ACORD Field | Why It Matters |
|---|---|---|
| Legal business name + DBA | First Named Insured | Who is insured and under what name |
| Entity type | Corporation / LLC / Partnership / Sole Proprietor / etc. | Affects liability structure and personal asset exposure |
| FEIN (or SSN for sole proprietors) | FEIN or SOC SEC # | Required for policy issuance |
| Date business started | Date Business Started | Underwriting history baseline |
| Website | Website Address | Secondary verification of operations |
| Business phone | Business Phone # | Contact record |
| Primary contact name + email | Contact Information | Broker communication |

---

### Section B — Premises (ACORD Page 2)

| Bot Question | ACORD Field | Why It Matters |
|---|---|---|
| SF street address + neighborhood | Street / City / State / ZIP | Location is the primary risk variable |
| Owner or Tenant? | Interest: Owner / Tenant | Determines who holds the property policy |
| If Tenant: landlord name + lease end date | Leaseback / Interest End Date | Property exposure is landlord's, not tenant's |
| Total building sq ft | Total Building Area | Structures valuation |
| Area occupied by business | Occupied Area | Proportional exposure |
| Area open to the public | Open to Public Area | Primary GL exposure driver (slip and fall) |
| Any area subleased to others? | Any Area Leased to Others | Sublessee operations create additional exposure |
| Annual revenues | Annual Revenues | Premium calculation basis |
| Full-time employees (inside/outside) | # Full Time Empl / Inside / Outside | Outside employees add GL exposure |
| Part-time employees (inside/outside) | # Part Time Empl / Inside / Outside | Headcount affects workers comp and GL |
| Nature of business | Nature of Business checkboxes | Sets the risk class |
| Description of primary operations | Description of Operations | Underwriter context |

---

### Section C — General Information (ACORD Q1–Q15)

| ACORD Q | Bot Question | Score Impact |
|---|---|---|
| Q1a/Q1b | Is this business a subsidiary? Any parent company? | Structural flag — parent company exposure |
| Q2 | Written safety manual? Designated safety person? Regular safety meetings? OSHA compliant? | +score per confirmed item |
| Q3 | Any exposure to flammables, explosives, or chemicals? | −score / triggers supplement |
| Q4 | Any other insurance with same carrier? | Informational |
| Q5 | Any policy declined, cancelled, or non-renewed in past 3 years? | Critical — distinguish non-payment vs. underwriting cause |
| Q6 | Any claims related to discrimination, harassment, or negligent hiring? | Major flag |
| Q7 | Any arson conviction or indictment in past 5 years? | Potentially disqualifying |
| Q8 | Any uncorrected fire or safety code violations? | Major −score — blocks submission |
| Q9 | Any bankruptcy, foreclosure, or repossession in past 5 years? | −score |
| Q10 | Any judgements or liens in past 5 years? | −score |
| Q11 | Is the business held in a trust? | Structural note for underwriter |
| Q12 | Any foreign operations or products? | Flags international supplement |
| Q13 | Any other business ventures not being insured here? | Cross-liability flag |
| Q14/Q15 | Do you own, operate, or hire others to operate drones? | Triggers drone liability note |

---

### Section D — Physical Property (Non-Public — Direct Underwriting Input)

Not on the ACORD 125 explicitly, but these are what underwriters need to see through ZIP-level noise. Verified via photo/document upload + AI review (Phase 2). Phase 1: stored for manual broker review.

| Item | What's Asked | Upload Required | AI Verification (Phase 2) | Score Impact |
|---|---|---|---|---|
| Roof | Material, age, last inspection date | Inspection report PDF | Confirms report date and roof type | High |
| Electrical panel | Type (knob-and-tube = major flag), age | Photo of panel | Identifies panel type, flags hazards | High |
| Fire suppression / sprinklers | Present? Last inspection date? | Inspection certificate PDF | Confirms certificate date | High |
| Monitored alarm system | Provider, response time SLA | Monitoring contract PDF | Confirms provider and contract active | High |
| Security cameras | Present? Coverage area? | Photo of camera setup | Confirms cameras present and operational | Medium |
| Fire extinguishers | Present? Inspected within 12 months? | Photo of tag | Reads tag date, confirms current | Medium |
| Plumbing | Age, any known issues | None | N/A | Medium |
| ADA compliance | Compliant? | Certificate or owner attestation | N/A | Medium |
| Burglar bars / roll-down security | Present? | Photo | Confirms presence | Low |

---

### Section E — Loss History (ACORD Page 4)

| Bot Question | ACORD Field | Notes |
|---|---|---|
| Any claims in past 5 years (regardless of fault)? | Loss History | If yes: date, type, amount paid, open/closed, subrogation Y/N |
| Prior carrier name | Carrier | Required for submission |
| Prior policy number | Policy Number | Required for submission |
| Prior policy dates + premium | Effective / Expiration / Premium | Baseline comparison |
| Lines previously covered | GL / Property / Auto / Other | Coverage gap identification |

**Note:** Phase 1 is fully manual — owner provides documents. Automated pull from prior carriers is a future iteration (Phase 4+).

---

## 9. Insurance Readiness Score

**Scale:** 0–100
**Visibility:** ✅ Both broker (dashboard) and business owner (via bot)
**Type:** ✅ Living document — updates as owner completes checklist items and uploads verifications

### Score Philosophy — Data-Backed, Documented Reasoning

Every weight in this score is a product decision, not an insurance authority's official model. The approach is:
1. Choose weights based on published industry data (III, NFPA, IBHS, FBI crime stats)
2. Document the "why" behind every weight choice in the implementation
3. Haarish reviews weights before Phase 2
4. One call with District Cover to pressure-test before score is used for real broker decisions

This means the score is **defensible and improvable** — not arbitrary. When a broker asks "why is this weighted this way?", there is a cited answer. When District Cover disagrees with a weight, the data behind it is already documented so the conversation is productive.

### Score Dimensions & Weight Justification

| Dimension | Weight | Rationale & Data Source |
|---|---|---|
| **Documentation Completeness** | 25 pts | Incomplete ACORD submissions are the #1 cause of underwriting delays and declines — not risk itself. A complete submission alone materially improves placement odds. Source: general MGA/broker industry knowledge; District Cover's own framing ("businesses are misunderstood, not too risky"). |
| **Safety & Compliance** | 25 pts | OSHA-compliant businesses with formal safety programs have 40–50% fewer workplace injury claims (OSHA.gov). Fire code compliance is a hard gate — uncorrected violations are an automatic submission blocker per ACORD Q8. Weight reflects both the gate function and the premium impact. |
| **Physical Property Condition** | 20 pts | IBHS data shows buildings with monitored alarms have 60–80% lower theft/burglary claim frequency. NFPA data shows sprinkler systems reduce property loss per fire by 50–75%. Roof age and condition is the single largest property valuation variable for commercial underwriters — older unverified roofs are automatically rated at worst-case. |
| **Claims & Financial History** | 20 pts | Prior cancellations for underwriting cause (not non-payment) are a near-automatic decline trigger in the surplus lines market. Bankruptcy/liens in the past 5 years indicate financial instability that raises moral hazard concern. Clean 5-year loss history is a primary positive signal. |
| **Neighborhood Context** | 10 pts | Weighted lowest intentionally — public data is supporting context, not the point. ZIP-level data is also the most unjust dimension since it penalizes businesses for things outside their control. 3 simple SF signals used (nearby fire, open violations, flood zone). Explicitly neutralized when business has documented mitigations (proximate risk statement). |

### Score Tiers

| Score | Status | Meaning | Next Step |
|---|---|---|---|
| 80–100 | ✅ Submission Ready | Clean profile | Route to broker review |
| 60–79 | ⚠️ Minor Gaps | Proceed with broker review | Checklist provided |
| 40–59 | ⚠️ Significant Gaps | Address before submission | Work through checklist first |
| 0–39 | ❌ Not Ready | Advisory mode only | Fix critical items first |

### Score Explanation Format
Every sub-score delivered to the business owner and broker includes a plain-English explanation with the reasoning:

> *"Your Physical Property score is 12/20. Your sprinkler system inspection certificate is missing — NFPA data shows sprinklers reduce property loss per fire by up to 75%, which is why underwriters weight this heavily. Uploading your current certificate is the single highest-impact action you can take right now."*

### Implementation Note for Builder
When building the score engine, every weight and sub-calculation must be accompanied by an inline code comment citing the data source behind it. This serves two purposes: makes the model auditable, and gives Haarish the material needed to defend or adjust weights in the District Cover review conversation.

### Checklist — Prioritized by Impact

Each item shows: what it is, why it matters (with data), how to complete it, and estimated impact.

**🔴 Critical — Blocks Coverage**
- Unresolved fire/safety code violation → must be corrected before any submission (ACORD Q8)
- Prior policy cancellation with no explanation → underwriters require disclosure (ACORD Q5)
- Loss history missing → blocks submission from being processed (ACORD Page 4)

**🟠 High Impact — Premium Reduction**
- Upload fire suppression inspection certificate → NFPA: sprinklers reduce property loss per fire by 50–75%. Estimated 8–15% premium impact.
- Provide monitored alarm contract → IBHS: monitored alarms reduce theft/burglary claim frequency by 60–80%. Reduces crime and theft premium.
- Document safety program / OSHA compliance → OSHA: formal safety programs reduce workplace injury claims 40–50%. Affects GL rating directly (ACORD Q2).
- Clarify open-to-public square footage → if overstated, you may be paying for GL exposure you don't have.

**🟡 Medium Impact — Coverage Improvement**
- Upload roof inspection report → undocumented roofs over 15 years are rated at worst-case by underwriters. A recent inspection showing good condition changes the rating.
- Clarify sublease arrangement → undocumented sublessee operations create hidden exposure.
- Confirm entity structure documentation (LLC operating agreement, etc.)

**🟢 Proactive — Renewal Preparation**
- Identify coverage gaps: Business Interruption? Cyber? Inland Marine?
- Set renewal reminder 90 days before policy expiration

---

## 10. Broker Export Package

What the broker generates and submits to District Cover (or another MGA):

| Component | Description | Phase |
|---|---|---|
| ⚠️ Pre-filled ACORD 125 fields | All sections A–E, mapped to correct form fields | 1 |
| ⚠️ Insurance Readiness Score | Overall + sub-scores with plain-English explanations | 1 |
| ⚠️ Uploaded documents | Organized and labeled: inspection reports, contracts, photos | 1 |
| ⚠️ Loss history table | Formatted per ACORD 125 Page 4 | 1 |
| ⚠️ Proximate risk statement | Auto-generated if SF data shows nearby incident with documented mitigations | 2 |
| ⚠️ Coverage gap summary | Lines of business missing or underinsured vs. business type norms | 2 |
| ⚠️ Submission lifecycle log | Timeline of all stages from intake to submission | 2 |

**Phase 1 format:** PDF
**Phase 3 format:** Direct API submission to Insly

---

## 11. Build Phases

---

### 🏗️ Phase 1 — Core Intake + Broker Dashboard (MVP)

**Goal:** Replace the broker's manual phone intake with a Telegram bot that collects ACORD 125 data and produces a broker-ready dossier.

**Success Metric:** A broker can onboard a new commercial client and receive a complete, reviewable dossier without a single phone call.

**Checkpoints:**
- [ ] Telegram bot accepts deep link with unique token, greets owner by name
- [ ] Bot walks through Sections A–E conversationally, one question at a time
- [ ] Bot accepts photo and PDF uploads, labels and stores them
- [ ] Session persistence — owner can exit and resume
- [ ] Broker dashboard: login, client list, new client form, Telegram deep link generation
- [ ] Broker dashboard: client detail view with all ACORD fields and uploaded documents
- [ ] Score engine: calculates 5-dimension score from intake data (Sections A–E, no SF public data yet)
- [ ] Score visible in broker dashboard
- [ ] PDF export: ACORD field summary + uploaded documents + score
- [ ] Broker receives notification when intake is complete

**Phase 1 Team Partition:**

Phase 1 should be built as three equal workstreams with clean interfaces between them. Each owner is responsible for shipping a demoable slice, writing/maintaining tests for that slice, and coordinating only through the shared schema/contracts documented in `docs/specs/2026-04-25-phase1-worksplit.md`.

| Owner | Workstream | Phase 1 Responsibility | Primary Deliverables |
|---|---|---|---|
| **Khem** | Telegram intake bot | Own the business-owner intake experience end to end. This includes unique deep link handling, resumable Telegram sessions, ACORD Sections A–E question flow, photo/PDF collection, upload labeling, and the "intake complete" handoff event. | `app/api/telegram/route.ts`, `lib/telegram/bot.ts`, `lib/telegram/questions.ts`, `lib/telegram/session.ts`, bot-facing upload handling |
| **Pratik** | Broker dashboard + export | Own the broker-facing review experience. This includes broker login/dashboard shell, client list, new client form, Telegram link display/copy flow, client dossier view, readiness score display, upload list display, and Phase 1 PDF export. | `app/(auth)`, `app/(dashboard)`, dashboard components, `app/api/export/[clientId]/route.ts`, `lib/pdf/dossier-pdf.tsx` |
| **Haarish** | Shared platform, data model, scoring, integration QA | Own the shared product backbone used by both other workstreams. This includes Supabase schema, RLS/storage setup, generated/shared DB types, ACORD field contract, readiness score engine, intake completion contract, broker notification contract, final PRD/plan alignment, and end-to-end acceptance testing. | `supabase/migrations`, `lib/supabase`, `lib/score/engine.ts`, shared field/contract docs, final integration QA |

**Cross-Workstream Contract:**
- Khem writes intake answers into `intake_data` and uploads into `uploads`.
- Haarish owns the exact DB/schema and score contract those writes must follow.
- Pratik reads from the same contract to render the broker dossier and export PDF.
- Phase 1 is not complete until one seeded/demo client can move through: broker creates client → Khem's bot completes intake → Haarish's score engine calculates score → Pratik's dashboard displays/export the dossier.

**Out of Scope for Phase 1:**
- ❌ Advisory Q&A
- ❌ Business owner score/checklist view via bot
- ❌ SF public data integration
- ❌ AI photo verification (photos stored for manual broker review)
- ❌ Submission lifecycle tracking / Kanban
- ❌ MGA routing from dashboard
- ❌ Insly integration

---

### 🏗️ Phase 2 — Advisory + Score Visibility + Submission Tracking + SF Data

**Goal:** Make the bot useful beyond intake. Owners see their score and checklist. Broker gets a pipeline view. SF public data enriches the score.

**Success Metric:** Business owners return to the bot between renewals. Broker tracks every client from intake to outcome in one view.

**Checkpoints:**
- [ ] Bot delivers readiness score to owner after intake completes
- [ ] Bot delivers prioritized action checklist with estimated impact per item
- [ ] Owner can query score/checklist status via bot at any time
- [ ] Owner can mark checklist items complete via bot; score updates
- [ ] Advisory Q&A: curated template answers, personalized using intake data
- [ ] Bot identifies coverage gaps from intake data and surfaces in advisory
- [ ] AI photo verification: Claude Vision reviews uploads, confirms content, updates score — no human in loop
- [ ] SF public data layer: fire incidents, crime stats, DBI violations, flood zone, seismic
- [ ] Proximate risk statement auto-generated and added to broker export
- [ ] Coverage gap summary added to broker export
- [ ] Submission lifecycle pipeline in broker dashboard (Kanban view)
- [ ] Broker advances pipeline stage manually
- [ ] Decline feedback loop: reason → plain English → owner checklist
- [ ] Bot notifies owner at Quote Received and Bound/Declined stages
- [ ] Mock Insly integration UI (hackathon demo): "Submit to District Cover" button pre-populates form from dossier data

---

### 🏗️ Phase 3 — Insly Live Integration + Renewal Mode

**Goal:** Direct API submission to District Cover's platform. Proactive renewal flow.

**Checkpoints:**
- [ ] Live API integration with Insly — broker submits without manual PDF upload
- [ ] System tracks policy expiration dates (set at binding stage)
- [ ] Bot proactively messages owner 90 days before expiration
- [ ] Renewal intake: asks only about changes since last submission
- [ ] Broker receives renewal dossier delta

---

### 🏗️ Phase 4 — Group Insurance + Scale

**Goal:** Group purchasing for same-building or community businesses. Expand beyond SF.

**Open questions to resolve before starting:**
- 🔲 Same-building (landlord-anchored) or BID/block-level (association-anchored)?
- 🔲 Who is the legal anchor for the group policy?
- 🔲 How does the broker manage a group vs. individual submission?
- 🔲 Group eligibility threshold (e.g., 3+ businesses at same address)?
- 🔲 Which city is next after SF?

---

## 12. Decisions Log

| Decision | Resolution | Date |
|---|---|---|
| Who initiates the intake flow? | Broker generates unique Telegram deep link from dashboard; business completes via bot | Apr 2026 |
| Does the broker get cut out? | No. Broker reviews and submits. Product makes them faster. | Apr 2026 |
| Language support | English only | Apr 2026 |
| Broker portal type | Web dashboard (broker logs in) | Apr 2026 |
| Business owner score visibility | Yes — both broker (dashboard) and owner (bot) see score and checklist | Apr 2026 |
| Checklist type | Living document — updates as items are completed and verified | Apr 2026 |
| Insly integration | Phase 1: PDF export. Phase 2: mock UI. Phase 3: live API. | Apr 2026 |
| Photo verification | AI review via Claude Vision — no human in loop | Apr 2026 |
| Loss history | Manual (owner provides documents) for Phase 1. Auto-pull is Phase 4+. | Apr 2026 |
| Advisory bot access | Invite-only — only businesses that went through broker-initiated intake | Apr 2026 |
| Advisory answer format | Curated templates, not free-form LLM | Apr 2026 |
| Submission tracking | Yes — 5-stage pipeline tracked in broker dashboard | Apr 2026 |
| District Cover structure | Licensed surplus lines broker + program admin. Carrier: Vantage Risk Specialty Insurance Company. | Apr 2026 |
| Geographic scope | San Francisco only — Phase 1 | Apr 2026 |
| Group insurance | Parked — Phase 4. Questions logged in Phase 4 section. | Apr 2026 |
| Phase 1 team partition | Khem owns Telegram intake bot; Pratik owns broker dashboard + export; Haarish owns shared schema, scoring, integration contracts, and final QA. | Apr 2026 |

---

## 13. Open Questions

| # | Question | Owner | Priority |
|---|---|---|---|
| 1 | What fields does Insly's API accept for policy submission? | District Cover to provide | 🔴 High — needed for Phase 3 |
| 2 | Score weight validation with District Cover — not a blocker. Score is built with publicly defensible data and documented reasoning. Haarish to review weights before Phase 2, then take one call with District Cover to pressure test. | Haarish review → District Cover call | 🟢 Low — handle before Phase 2 goes live with real brokers |
| 3 | Should the broker be able to edit intake answers before submission, or only add annotations? | Product decision | 🟡 Medium |
| 4 | How does the system handle a business that changes brokers mid-lifecycle? | Product decision | 🟢 Low — Phase 2+ |
| 5 | Group insurance: anchor model, legal structure, eligibility threshold | Product decision at Phase 4 start | 🟢 Low |

---

## 14. Implementation References

| Reference | URL / Location | Purpose |
|---|---|---|
| **Telegram Bot Inspiration** | [Lendica ERP Data Ingestion](https://github.com/Lendica-PlayGround/erp-data-ingestion/tree/main) | Conversational intake design, session management, question sequencing. Read before building the bot. |
| **ACORD 125 Form** | [ACORD 125 PDF](https://www.firstchoiceii.com/pdf/Acord125CommInsApp.pdf) | Ground truth for all intake field mapping. Download and read before building intake question sequence. |
| **Telegram Bot API** | [core.telegram.org/bots/api](https://core.telegram.org/bots/api) | Bot implementation docs |
| **District Cover Website** | [districtcover.com](https://www.districtcover.com/) | Product context, broker portal reference |
| **District Cover Broker Portal** | [Insly Platform](https://districtcover.app.us.insly.com/login) | Integration target for Phase 3. Reference for mock UI in Phase 2. |
| **SF Fire Incident Data** | [SF Open Data](https://data.sfgov.org/Public-Safety/Fire-Incidents/wr8u-xric) | Proximate risk — Phase 2 |
| **SF Crime Data** | [SF Open Data](https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783) | Neighborhood context score — Phase 2 |
| **SF Building Inspection** | [SF DBI](https://www.sf.gov/departments/department-building-inspection) | Open code violations — Phase 2 |
| **FEMA Flood Map** | [msc.fema.gov](https://msc.fema.gov/portal/home) | Flood zone by address — Phase 2 |

---

*This PRD is a living document. Update the Decisions Log when decisions are made. Update Open Questions when resolved. Each phase should be reviewed and signed off before the next phase build begins. The implementing agent should read all Implementation References before starting each phase.*
