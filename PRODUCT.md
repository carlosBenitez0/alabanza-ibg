# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Church worship team members (singers, musicians) at IBG.
They use the app remotely — at home or on mobile during the week — to prepare for upcoming services. Their core job: register (singers) or review (musicians) the weekend's privileges and the exact songs and keys to practice.

**Secondary:** One admin who manages roles and instruments, and can assign people to special events. There are no leaders: the team works as peers.

## Product Purpose

Alabanza IBG is a worship team coordination app for a local church (IBG). It bridges the gap between scheduling and musical preparation: singers register their weekly privilege with its songs, keys and backing vocals, and musicians see every song of the weekend in the key the singer chose, so everyone prepares confidently before the service. The app keeps a record of every service and its participants.

**What success looks like for a member:** Open the app, see your upcoming events, and immediately know what songs you'll need to practice.

## Positioning

Alabanza IBG ties the song list directly to each privilege — a musician opens the weekend's songs already transposed to the singer's key, and each singer sees who sings backing vocals with them. A shared calendar + WhatsApp group cannot link individual assignments to a specific, published song list with confirmation status.

## Operating Context

- Members use the app on mobile or desktop during the week, not during the live service itself.
- Singers register their privileges in advance (by midweek) so musicians have time to practice.
- The church operates exclusively in Spanish; no English content is needed anywhere in the product.
- Roles: **singer**, **musician** and **admin** only. A musician is shown by their instrument (Guitarrista, Pianista…), assigned by the admin. Anyone can be a backing vocal (corista) in a singer's privilege.
- Regular Saturday/Sunday services are weekly privileges (alabanzas, coros, ensayo). Events are only special invitations: camps, joint events with other churches, invitations to minister.

## Capabilities and Constraints

- **Auth:** Supabase-backed authentication (email/password and invite-based onboarding implied).
- **Privileges:** Weekly Saturday/Sunday slots registered by singers with songs, keys and backing vocals; everyone sees the whole team's privileges in the weekly table and the calendar.
- **Events:** Any member creates special events and signs up with a role; the creator and the admin edit or delete them.
- **Assignments:** The admin can also assign people to events; they confirm their availability (pending → confirmed/declined).
- **Repertoire:** Shared song catalog with keys and chord sheets (transposable, stage mode, PDF).
- **Notifications:** In-app notices for new privileges, backing vocals, songs, events and assignments.
- **Admin panel:** Admin only: roles, instruments, event assignments.
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
