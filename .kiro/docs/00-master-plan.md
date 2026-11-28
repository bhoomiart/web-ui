# Bhoomi Art — Master Plan

> This is the single source of truth for the entire project.
> Every other document links back here.
> Update this when scope, priorities, or architecture changes.

---

## What We're Building

A premium terracotta e-commerce platform for **Bhoomi Art** — a handcrafted goods business.
Two interfaces: a customer storefront and a secure admin dashboard.

**Brand identity:**

- Name: Bhoomi Art
- Tagline: Beauty of Mother Earth
- Signature: Rooted in Earth · Shaped by Hand · Born with Love

---

## Document Index

| Doc                                                      | Purpose                                                                                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [01-requirements.md](./01-requirements.md)               | What the product must do — features, rules, constraints                                               |
| [02-design.md](./02-design.md)                           | How we're building it — architecture, schema, tech decisions                                          |
| [03-execution.md](./03-execution.md)                     | Who does what, in what order — agents, tasks, subtasks, status                                        |
| [04-cart-auth-flow-plan.md](./04-cart-auth-flow-plan.md) | A10 proposal: stock-validated cart, customer auth (OTP + email), checkout gate. **Pending approval.** |

---

## Technology Stack

| Layer          | Choice                      | Notes                                             |
| -------------- | --------------------------- | ------------------------------------------------- |
| Framework      | Next.js 16.4.6 (App Router) | Already in repo — has breaking changes from 14/15 |
| Language       | TypeScript 5                | Strict mode                                       |
| Styling        | Tailwind CSS 4.3            | Via `@tailwindcss/turbopack`                      |
| Fonts          | Playfair Display + Lato     | Already configured                                |
| Backend / DB   | Supabase (PostgreSQL)       | Not yet configured                                |
| Auth           | Supabase Auth               | Not yet configured                                |
| Storage        | Supabase Storage            | Not yet configured                                |
| State (client) | Zustand (to be installed)   | Cart, UI state                                    |
| Build          | Turbopack                   | Dev + build                                       |

---

## Key Constraints

- No online payment gateway in this release — orders are taken, payment handled offline
- WhatsApp is the primary communication channel — Click-to-Chat only for now (no Business API)
- No customer accounts in this release — guest checkout only
  - **Superseded by A10** ([04-cart-auth-flow-plan.md](./04-cart-auth-flow-plan.md)): customer accounts are in scope, login is required at checkout, the cart is stored server-side for signed-in users, login is email OTP + email/password (WhatsApp OTP deferred), shipping is per-state. Task approval is still required before each A10 task starts.
- Every agent must read `node_modules/next/dist/docs/` before writing Next.js code
- No service-role Supabase key in any client bundle — all privileged calls via Server Actions
- RLS must be enabled on every Supabase table
- Stock reservation must be atomic (Postgres transactions) — no overselling
- Every admin action that changes data must be logged in `audit_logs`

---

## High-Level Phases

```
Phase A  →  Foundation (design system, app shell)
Phase B  →  Data layer (Supabase, schema, RLS)
Phase C  →  Admin dashboard (runs parallel with storefront)
Phase C  →  Customer storefront (runs parallel with admin)
Phase D  →  Inventory & restock
Phase E  →  Cart, checkout, orders
Phase F  →  Reviews, WhatsApp communication layer
Phase G  →  SEO, performance, deployment readiness
Phase H  →  Customer accounts, server-side cart, stock-validated checkout (A10, done; see 04-cart-auth-flow-plan.md)
```

See [03-execution.md](./03-execution.md) for the full agent + task breakdown.

---

## Approval Rule

**No task starts without explicit approval.**
Every task is presented with its scope before work begins.
Approving a phase does not approve every task inside it.

---

## Status

- [x] Requirements reviewed
- [x] Architecture designed
- [x] Task breakdown created
- [ ] Task 1 approved
- [ ] Implementation started
