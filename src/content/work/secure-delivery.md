---
title: "Automating a secure, traceable delivery workflow"
description: "A scheduled .NET service connecting SQL extraction, managed secrets, authenticated file delivery, status updates, and failure reporting."
category: "Cloud automation"
role: "End-to-end service developer at JustGo"
status: "Delivered · professional account"
order: 6
featured: true
stack:
  - "C#"
  - ".NET"
  - "SQL"
  - "Azure WebJobs"
  - "Azure Key Vault"
  - "SFTP"
diagram: delivery
---

## Problem and context

A recurring card-production process needed data to move from an operational platform to an external service provider. The work included extracting the appropriate records, preparing a structured output, transferring it through an authenticated channel, and recording the result. A reliable process needed to connect those responsibilities so that operators could understand whether a delivery had completed or needed attention.

I developed this workflow at JustGo for an anonymized organization. The public account omits the customer, provider destination, schedule, credentials, infrastructure identifiers, and file specification. The useful engineering problem is a common one: a scheduled task crosses database, cloud, and external-service boundaries, and a failure at any boundary can leave a different kind of incomplete work.

## My contribution

I developed the scheduled C#/.NET service integrating SQL extraction, cloud-based secret retrieval, authenticated file transmission, status updates, logging, and failure reporting. The retrospective audit describes the application as an Azure WebJob and identifies Azure Key Vault in the secret-management work. My contribution covered the service implementation and deployment rather than only a reporting query or manual transfer step.

The external provider remained responsible for its own service and downstream production. My responsibility was the JustGo-side workflow and its operational behavior. This distinction matters when describing the outcome: successful transmission is one boundary of the process, while acceptance and use by another organization are separate events unless independently confirmed.

## Engineering decisions

**Connect extraction to an explicit delivery process.** SQL extraction was a component of a broader scheduled workflow. Preparing a file and delivering it are different stages, and the historical implementation also included status updates. Explaining these stages separately helps identify whether a problem concerns the selected data, output preparation, authentication, transfer, or recorded result. The public narrative does not expose the original selection rules or database structures.

**Retrieve secrets through managed cloud facilities.** Cloud-based secret retrieval and authenticated transmission were documented parts of the service. That is the supported security contribution. This account does not publish authentication material or operational configuration, and it does not turn use of a secret store into a claim that every aspect of the wider environment was independently security-audited.

**Make execution observable.** Logging and failure reporting were included in the implementation. A scheduled service needs a way to communicate what happened when no person is watching the run. The historical evidence supports those operational features, but not a universal guarantee of immediate detection or automatic recovery from every possible failure. The value is a traceable execution outcome rather than an assumption that a scheduled task always succeeded.

**Respect the boundary between transmission and acceptance.** Authenticated file delivery establishes a technical handoff. It does not automatically establish that the recipient validated the file or completed card production. This is a limitation used to explain the account, not a claim that an additional acknowledgment protocol was implemented. A stronger delivery contract could be explored separately in a new public demonstration.

## Validation and evidence

**Historical account.** The dossier describes the complete service and its principal responsibilities. The career audits refer to a source-level implementation artifact and subsequent automated execution notifications. I reviewed those audit descriptions, not the underlying employer source or every notification. This supports the reported implementation and automated operation without converting the audit into a public code review or an independently verified reliability study.

**Proposed public validation.** An independent demonstration could use fictional records, a local simulated recipient, and disposable test credentials. Expected output would be specified before running extraction. Controlled failures could include an unavailable recipient, rejected authentication, an interrupted transfer, and an unsuccessful status update after transmission. Each scenario would define what the operator should see and whether a retry is safe.

That example could also distinguish a transfer result from an explicit recipient acknowledgment, making uncertainty visible when the two disagree. Tests would inspect output contents and processing outcomes while ensuring that reports exclude secret values. These are proposed tests for a new artifact. No such public service, recovery policy, or measured reliability result is claimed as completed here.

## Outcome and limitations

The delivered contribution was a scheduled workflow joining data preparation, managed secret retrieval, authenticated transmission, database updates, and operational reporting. It moved a recurring process into an implemented service with visible execution outcomes. This account makes no claim of uninterrupted operation, quantified time savings, zero data loss, or guaranteed downstream acceptance.

The public evidence supports end-to-end implementation responsibility while leaving confidential materials private. A conceptual diagram can explain the service boundaries and the distinction between data, credentials, and operational status. It should not disclose the original infrastructure or present proposed acknowledgment and recovery features as historical facts.

## Research connection

This work connects to provenance and dependable data movement across organizational boundaries. A future controlled study could compare recovery policies under interrupted transfers and delayed acknowledgments, recording both completed deliveries and uncertain outcomes. Those questions also matter for sensitive research data workflows. The connection is methodological; this case does not claim a formal security certification, a completed reliability experiment, or a deployed healthcare data pipeline.
