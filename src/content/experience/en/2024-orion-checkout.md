---
locale: en
sample: true
kind: project
title: Orion checkout rebuild
org: Orion Commerce
start: 2024-03
end: null
location: Shanghai
summary: Consolidated settlement logic from three services into one observable payment flow that can be traced and replayed.
highlights:
  - Raised settlement success from 92% to 99.6% and cut reconciliation time from 40 minutes to 6.
  - Added idempotency keys and a state machine so duplicate callbacks never post twice.
  - Built a failed-payment dashboard that lets operations locate common issues within 10 minutes.
tags:
  - TypeScript
  - Node.js
  - PostgreSQL
  - Redis
links:
  - label: Project notes
    url: https://github.com/linyizhou/orion-checkout
draft: false
---

## Context

Orion's settlement logic was spread across the order, payment and ledger services. Whenever money moved but the order did not settle, an engineer had to stitch a timeline from three logging systems. It usually took half a day. Finance also reconciled by hand every day, which was especially error-prone at month end.

## Role

- Owned the rebuild plan and the core state machine.
- Worked with finance and operations to classify failure types and decide what could be retried automatically.
- Designed the data model for reconciliation jobs and the failed-payment dashboard.

## Process

We started by drawing a single state diagram from "settlement created" to every terminal state, including external callbacks and timeout branches. Then we did three things:

1. **Centralize state.** All transitions go through one module. Business code is no longer allowed to write the state field directly.
2. **Make it idempotent.** Every callback carries an idempotency key. Retries follow the same path and return the existing result.
3. **Make it observable.** Each transition writes a structured event with order id, channel, duration and failure reason. The dashboard aggregates those events.

<img src="/projects/2024-orion-checkout/cover.svg" width="1200" height="630" alt="Diagram of settlement flow consolidated from three services into one state machine" />

## Outcome

- Settlement success rose from 92% to 99.6%.
- Average reconciliation time dropped from 40 minutes to 6.
- Duplicate postings went from a few per month to zero.
- Operations can see which step is stuck without asking an engineer to read logs.

## Retrospective

The biggest win was not performance. It was making "what state are we in, and what happens next" the single source of truth in code. If I did it again, I would bring finance's failure taxonomy in earlier; the state machine would have avoided two iterations.
