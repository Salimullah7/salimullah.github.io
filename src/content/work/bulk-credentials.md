---
title: "Separating bulk credential issuance from live activity"
description: "A co-developed batch-processing approach for historical digital passes, with workload isolation and attention to notification side effects."
category: "Reliable processing"
role: "Co-developer and bulk rollout engineer at JustGo"
status: "Delivered · professional account"
order: 4
featured: true
stack:
  - "C#"
  - ".NET"
  - "SQL"
  - "Batch processing"
  - "Digital wallet integrations"
diagram: batch
---

## Problem and context

Digital membership passes can be issued during an ordinary member transaction or generated for people whose membership records already exist. Those workloads may produce a similar final credential, but their operational needs differ. A historical issuance run should not unintentionally compete with live activity or trigger the communications expected after an individual purchase.

At JustGo, I worked on bulk generation for anonymized membership organizations. The existing transactional processing path was not automatically a suitable route for issuing historical passes. The problem involved both execution capacity and behavior: generating a credential and sending a member notification were separate actions whose association needed careful handling. This case describes that distinction without publishing internal queue definitions, state values, or deployment configuration.

## My contribution

I co-developed and operated a dedicated bulk-processing approach using C# and SQL. My documented contribution included the bulk execution strategy, preparation of batches, and operational rollout. A senior engineering colleague contributed key processing-state mechanisms. This was shared engineering work, and the underlying platform and credential integrations were wider than my individual contribution.

The professional account describes an isolated processing approach for historical records alongside ordinary transactional activity. I helped turn that approach into executable bulk runs and supported its use during delivery. I do not claim sole authorship of the state-handling design, the digital wallet product, or the external credential platforms.

## Engineering decisions

**Distinguish workload intent.** A pass generated as part of a live transaction and a pass generated during historical issuance should not inherit identical behavior merely because they share an output format. The historical approach used isolated processing states and dedicated bulk execution. The important decision was to represent the purpose of the work explicitly enough that bulk activity could be handled separately.

**Treat notifications as a separate side effect.** An unexpected message to a member is an externally visible consequence, even if credential generation itself succeeds. Controlling that behavior was part of the reason for the bulk approach. The public lesson is to consider all consequences of processing, including communications. This account does not expose how notification control was implemented inside the original platform.

**Use batches as operational units.** My contribution included the execution strategy and rollout of bulk work. Dividing the workload into batches made execution a distinct operational responsibility rather than an accidental extension of ordinary member processing. The evidence does not justify publishing a preferred batch size, a universal capacity limit, or a benchmark for other systems. Those choices depend on the environment and would need their own measurements.

**Keep platform ownership separate from rollout responsibility.** External wallet services, application behavior, processing states, and bulk execution each have different owners and failure boundaries. My account is strongest around the co-developed batch approach and its operation. It should not imply that I created the external wallet services or independently built every supporting mechanism. That distinction also makes a future technical discussion more precise about which decisions I can explain firsthand.

## Validation and evidence

**Historical account.** The dossier and retrospective career audits describe co-development, isolated processing, and bulk operational runs. The audits refer to engineering discussions and execution-related records, but those underlying materials are not published or independently re-executed here. Reported throughput and aggregate issuance figures are excluded from this public case; they are not necessary to explain the engineering contribution.

**Proposed public validation.** A separate simulator could compare a shared worker with workers that distinguish live and historical issuance. Fictional tasks would make processing intent, credential creation, and notification decisions visible. Tests could introduce a failed credential request, an interrupted batch, and a repeated task to show how a chosen retry policy affects completion and side effects.

The example would define expected notification behavior before execution and verify that simulated historical-issuance tasks follow that policy. Any queue lengths, delays, or service times would be declared hypothetical inputs. Such a simulator would test its own new design; it would neither recreate the private implementation nor establish historical production performance. The simulator and those checks remain proposed public work.

## Outcome and limitations

The delivered contribution was a dedicated bulk-processing strategy, co-development of the approach, and operational rollout for historical credential issuance. The account demonstrates attention to workload separation and unintended effects alongside the mechanics of generation. It makes no claim of unlimited capacity, zero failures, or guaranteed absence of duplicate issuance.

The public evidence supports the type of work and the division of responsibility. It does not provide a complete performance study or a formal correctness proof. A conceptual diagram should therefore explain the difference between live and bulk intent, rather than present confidential processing states as a reconstructed architecture.

## Research connection

This problem connects to workload isolation, scheduling, and the semantics of side effects in asynchronous systems. A future experiment could vary arrival patterns and failure conditions in a synthetic model, then examine waiting time and unwanted repeated actions separately. That would be a new evaluation with stated assumptions. The professional case itself is an engineering delivery account, not evidence that such an experiment or a formal scheduling study has already been completed.
