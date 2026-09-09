# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Church worship team members (singers, musicians) at IBG.
They use the app remotely — at home or on mobile during the week — to prepare for upcoming services. Their core job: check which events they're assigned to and review the exact song list they'll perform.

**Secondary:** Worship leaders and admins who create events, assign team members, and publish song lists.

## Product Purpose

Alabanza IBG is a worship team coordination app for a local church (IBG). It bridges the gap between scheduling and musical preparation: members see their service assignments alongside the specific songs they'll sing or play, so they can prepare confidently before the service. Leaders control what gets published, and the app keeps a record of every service and its participants.

**What success looks like for a member:** Open the app, see your upcoming events, and immediately know what songs you'll need to practice.

## Positioning

Alabanza IBG ties the song list directly to each member's personal assignment — a musician sees only the set list for the services they're on, not a global calendar full of noise. A shared calendar + WhatsApp group cannot link individual assignments to a specific, published song list with confirmation status.

## Operating Context

- Members use the app on mobile or desktop during the week, not during the live service itself.
- Worship leaders prepare song lists in advance and publish them once finalized.
- The church operates exclusively in Spanish; no English content is needed anywhere in the product.
- Roles: **singer**, **musician**, **leader**, **admin**. Leaders can assign members and publish song lists. Admins have full management access.
- Event types include regular Sunday services and special worship events.

## Capabilities and Constraints

- **Auth:** Supabase-backed authentication (email/password and invite-based onboarding implied).
- **Events:** Created by leaders/admins; members are assigned to events with a role.
- **Song lists:** Attached to events; members see the song list only when published.
- **Assignments:** Members confirm their availability (status: pending → confirmed/declined).
- **Notifications:** In-app notifications for new assignments and song list updates.
- **Admin panel:** Leaders and admins can manage events, assignments, users.
- **Stack:** Next.js 16 (App Router, Turbopack), Tailwind CSS v4, Supabase (Postgres + Auth + Realtime).
- **Language:** 100% Spanish UI.

## Brand Commitments

- **Name:** "Alabanza IBG" — fixed.
- **Logo:** `/public/ibglogoconletras.png` and `/public/ibglogo.png` — present and in use as the favicon and sidebar mark.
- **Color palette:** The current indigo/purple (#6366f1) is a working choice, not a committed brand color. Future design work may replace or evolve it.
- **Voice:** Warm, reverent, and practical. No corporate formality. This is a community tool built by a believer for fellow worshippers.

## Evidence on Hand

- Working Next.js codebase with auth, dashboard, event management, song list, notification, and admin routes.
- IBG logo assets: `ibglogo.png`, `ibglogoconletras.png` in `/public`.
- No marketing copy, testimonials, press, or third-party endorsements exist and must not be fabricated.

## Product Principles

1. **Preparation over administration.** Every screen should help a member prepare to worship well, not bureaucratic overhead.
2. **Role clarity above all.** What a member sees should be scoped to their assignments only — no noise, no confusion about what they need to do.
3. **Simplicity serves reverence.** The tool should feel effortless, never distracting. If the UI draws attention to itself, it has failed.
4. **Spanish-first, always.** Every label, error, empty state, and microcopy must be in natural, conversational Spanish.
5. **Built with love, not obligation.** The product exists because a developer worships God through code — that spirit should feel present in the craft.
