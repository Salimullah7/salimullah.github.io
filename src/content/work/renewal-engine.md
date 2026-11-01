---
title: "Turning submitted files into membership operations"
description: "A C# processing workflow connecting external membership files to validation, identity matching, renewal operations, and reported outcomes."
category: "Backend engineering"
role: "Processing-system developer at JustGo"
status: "Delivered · professional account"
order: 2
featured: true
stack:
  - "C#"
  - ".NET"
  - "CSV processing"
  - "SQL"
  - "File-transfer workflows"
diagram: renewal
---

## Problem and context

An external organization needed a practical route for submitting membership information without manually creating or renewing each record through an application interface. Its input arrived as structured files. The engineering task was to turn those submissions into valid membership operations while keeping processing outcomes understandable to the people responsible for the data.

This was a backend automation project at JustGo for an anonymized customer. The important boundary was between externally supplied information and an operational membership system. A file could be readable while containing an unmatched person, an unusable value, or information insufficient for a renewal. Treating file arrival as permission to apply every row would miss the difference between accepting input and completing a business operation.

## My contribution

I developed the C# processing system that connected a file-transfer workflow with membership-processing logic. The historical account describes components for file retrieval, CSV parsing, validation, renewal operations, and database processing. It also describes member creation or matching, membership-related updates, club associations, processing outcomes, and error handling.

My contribution was the processing workflow across those responsibilities. I do not claim authorship of the entire membership platform or the business policies it implemented. The public description leaves out the customer's file specification, proprietary rules, original modules, and operational configuration. The useful engineering story is how the stages fit together and why each stage needs its own interpretation of success.

## Engineering decisions

**Separate reading a file from accepting a record.** Retrieval and parsing answer whether the submission can be accessed and interpreted. Validation answers whether its contents can support a permitted operation. These responsibilities appear separately in the historical implementation account. Keeping that distinction visible helps explain why a correctly formatted CSV row may still need rejection or investigation.

**Resolve identity before applying membership changes.** Member creation and matching were part of the system, alongside renewal and club association processing. Those concerns are connected: the right operation against the wrong person is still an incorrect result. The account supports identity matching as a responsibility, but it does not establish a particular matching algorithm, confidence score, or automatic duplicate-merging policy. Those details should not be invented for a public narrative.

**Keep business processing distinct from file handling.** The workflow connected submitted information to membership behavior rather than stopping at an uploaded file. Renewal operations and database processing therefore had different responsibilities from CSV interpretation. This separation is useful when explaining failures: an unreadable value, an unresolved identity, and an unsuccessful membership change are different classes of problem, even if they originated in the same submission.

**Make outcomes part of the workflow.** Processing results and error handling were included in the historical work. A batch is useful only when its operator can understand what happened to the submitted records. This account does not claim a particular public report format or a proven exactly-once processing guarantee. Repeat submissions and interrupted operations remain important questions for a future independently developed demonstration.

## Validation and evidence

**Historical account.** The dossier records my development of the C# system and its principal responsibilities. It describes an implemented file-to-membership workflow, not merely a proposed uploader. Original code, execution traces, customer files, and acceptance records are not included as public evidence. This case therefore reports the historical contribution without claiming that visitors can reproduce its production behavior.

**Independent public demonstration.** The [membership-processing sandbox](../../lab/) accepts fictional CSV submissions and simulates member creation and renewal. Its tests cover missing values, mismatched identities, malformed CSV, duplicate IDs, repeated runs, quoted fields, and input limits. Each parsed record has a created, renewed, or rejected outcome; summary counts account for every processed row.

The demonstration resets its synthetic register for each run. It exposes a deliberate within-batch duplicate policy, but it does not implement durable transactions, failure recovery, or cross-run idempotency. These independently chosen rules and tests illustrate the engineering questions; they do not reproduce or verify the historical system.

## Outcome and limitations

The delivered contribution connected structured external submissions to membership-processing operations and their outcomes. It demonstrates work spanning C# file processing, validation, identity handling, database interaction, and operational error handling. No processing totals, time savings, error-rate reductions, or service-level claims are attached to this public account.

The available description does not establish every edge-case policy or recovery guarantee. A future public implementation should state those policies explicitly rather than inherit assumed behavior from this narrative. Its results would validate that independent example, while the historical delivery would remain supported by the professional account.

## Research connection

The problem connects to reliable decision pipelines: external input moves through interpretation, validation, identity resolution, and a consequential state change. Similar boundaries matter in data-intensive research when accepted records become training examples or trigger downstream processing. A research extension could compare how ambiguity-handling policies affect error propagation using synthetic submissions. This case does not claim that the membership engine used machine learning or that such an evaluation has already been completed.
