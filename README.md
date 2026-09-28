# Installment Widget — Design Doc

*As of 2026-09-28*

An embeddable installment eligibility + calculator widget merchants could drop into a checkout page — a portfolio project exploring the partner-integration side of Blnk's product, not the ledger.

## Problem

Blnk approves point-of-sale financing in-store, but a shopper has no way to see the real numbers, monthly payment, total cost, tenor options, before they commit to applying. A merchant checkout page or terminal that can preview an installment plan instantly, without a full application, makes the financing conversation easier to have and easier to trust.

This is a small self-hosted demo of that missing piece: an embeddable calculator a merchant could drop into any checkout page.

## What it is

A small widget a merchant embeds with one script tag on a product or checkout page. Shopper flow:

1. Shopper enters (or the page passes in) a purchase amount.
2. Widget shows tenor options (3 / 6 / 12 / 24 / 36 months) with the monthly payment and total cost for each.
3. Shopper taps "Check eligibility," enters a National ID.
4. Widget shows approved / declined / pending, plus the confirmed plan on approval.

No page reload, no redirect off the merchant's site until the shopper actually wants to finish the application.

## Architecture

```
Merchant page  →  JS/TS widget  →  Demo API (NestJS, on Railway)  →  Postgres
  (script embed)   (calculator +      (installment math +              (tenor/rate rules +
                     ID form)          scripted eligibility)             mock applicants)
```

Four pieces, all mine to host, none of it touching Blnk's real systems:

- **Widget** — vanilla JS/TS, compiled to one small bundle, no framework runtime. Embeds via a single `<script>` tag plus a `data-merchant-id` attribute. Works inside a plain HTML page, Shopify, or WooCommerce without conflicting with the host site's own JS.
- **Demo API** — NestJS, same stack as the Riff backend. Owns the installment math and a scripted eligibility check (rule-based on the National ID's checksum and a mock credit table, not a real bureau lookup).
- **Postgres** — stores tenor/rate rules and a small table of mock applicants so eligibility responses are consistent on repeat lookups, not random.
- **Hosting** — new Railway project, same account as Riff. API and Postgres as two Railway services; the widget bundle served as a static file from the API or a tiny CDN-style route.

## API sketch

| Endpoint | Method | Does |
| --- | --- | --- |
| `/plans` | GET | Given an amount, returns each tenor's monthly payment and total cost |
| `/eligibility` | POST | Given a National ID + amount, returns approved / declined / pending |
| `/applications/:id` | GET | Polls a pending decision's status |

All three are mine, mocked to behave like a real underwriting flow (a pending state that resolves after a few seconds, occasional declines), not calls to Blnk.

## Why not Flutter

Flutter is my strongest tool, but not the right one for this piece. A merchant embed has to drop into someone else's page (Shopify theme, WooCommerce, a hand-rolled site) without fighting their existing JS, load fast on a slow connection, and add close to nothing to the page's weight. Flutter Web ships its own renderer and runtime, on the order of hundreds of KB to a few MB before any app code, which is the wrong tradeoff for a widget that has to sit quietly inside someone else's checkout page. A small JS/TS bundle is the honest choice for this piece, even though it's not my usual stack; the backend behind it is exactly my stack (NestJS, same as Riff).

## Scope note

Blnk has no public API, so nothing here talks to their real systems. This is a self-hosted demo, on my own Railway account, that simulates the shape of their partner-integration problem: real widget code, a real backend, a real (if simplified) eligibility flow. It's meant to show product and integration thinking, not to claim I've built against Blnk's actual stack. If a real integration ever happens, the eligibility and plan endpoints are the two that would be swapped for Blnk's own.

## Repo layout

```
widget/   — embeddable JS/TS widget (calculator UI + eligibility form)
api/      — NestJS demo backend (plans, eligibility, applications)
```

## Status

Scaffolding in progress. See open issues / commits for current state.
