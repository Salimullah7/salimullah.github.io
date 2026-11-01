---
title: "Making analytical extracts preserve operational meaning"
description: "SQL reporting views and integration guidance addressing incomplete records, multi-valued attributes, identity relationships, and financial interpretation."
category: "Analytical data engineering"
role: "Reporting-view developer and integration adviser at JustGo"
status: "Delivered · professional account"
order: 5
featured: true
stack:
  - "T-SQL"
  - "SQL reporting views"
  - "Azure SQL"
  - "Google BigQuery interoperability"
  - "Data reconciliation"
diagram: analytics
---

## Problem and context

An anonymized membership organization needed dependable operational data for an external analytics workflow. Memberships, people, organizations, payments, and related information were stored across normalized entities. Existing reporting structures did not always preserve the full population or represent complex attributes in a form that downstream consumers could interpret consistently.

The destination analytics environment included Google BigQuery, with related data use in Dotdigital. My work took place on the JustGo side of that boundary. An extract could be structurally acceptable and still be analytically misleading: missing records change the population under analysis, a shortened multi-valued attribute changes what is known about a person, and an unclear financial field changes the meaning of an aggregate.

## My contribution

I developed SQL reporting views, investigated missing membership information, improved relationships among normalized entities, and provided technical guidance for downstream analytical integration. The historical account includes work on multi-select fields, family identity relationships, and the interpretation of financial reporting fields.

My role was source-side data engineering and integration support. I do not claim independent ownership of the customer's BigQuery infrastructure or its complete marketing environment. Building reporting interfaces, explaining joins, and clarifying the meaning of exported data were substantial contributions, but they are distinct from building every downstream ingestion job, dashboard, or campaign.

## Engineering decisions

**Examine the population behind a report.** A successful query does not establish that its output contains every intended record. The historical investigation addressed membership information absent from existing reporting structures and improved the relationships used in extraction. The general decision was to investigate completeness against the intended population rather than accept the existing view as the definition of that population.

**Preserve multi-valued information.** Some attributes can legitimately contain several selections. An extraction that represents only one selection changes the information available to analysts. My work included addressing this representation problem. The public account does not publish the customer's fields or require a particular serialization format; it explains why preserving all selected values is a separate concern from producing a file or table that can be ingested.

**Keep identity separate from shared contact information.** The work also involved family relationships and downstream identity interpretation. Several people may share a contact detail while remaining distinct members. A convenient communication field is therefore not automatically a reliable analytical identity. The documented contribution concerned representing those relationships for downstream use, without claiming a new identity-management platform or publishing the original mapping structures.

**Clarify financial meaning before aggregation.** Gross values, discounts, and net amounts need interpretation in the context of the records that produced them. My contribution included guidance on relationships and financial reporting semantics. The broader lesson is that a plausible total can still answer the wrong question when invoice-level and item-level information are combined without a clear unit of analysis. This case does not reproduce customer accounting rules or claim an audit of their financial statements.

## Validation and evidence

**Historical account.** The dossier describes the reporting-view development and investigations. Retrospective audits refer to implementation materials and technical exchanges about completeness, relationships, and downstream interpretation. Those underlying materials have not been published with this case. The account supports source-side engineering and guidance; it does not independently verify the full warehouse pipeline or establish a measured improvement in analytical accuracy.

**Proposed public validation.** A separate synthetic example could define the intended member population before constructing an extract. Fixtures would include a person without an optional related record, an inactive historical membership, several selected attribute values, people sharing a contact detail, and an invoice containing multiple items and a discount.

Checks would compare expected identities and relationships with extracted output, verify that all selected values survive, and reconcile financial examples at a stated level of detail. They would also look for unintended multiplication of rows when related tables are joined. Every expected result would belong to the fictional dataset, with no implication that it reproduces a private schema. This example and its validation results remain proposed public work.

## Outcome and limitations

The delivered work provided SQL reporting interfaces and technical guidance addressing incomplete and inconsistently represented analytical data. The attributable outcome is improved source-side extraction and interpretation for downstream integration. No record totals, revenue effects, processing-speed claims, or production completeness percentages are presented here.

A source-side correction cannot by itself certify every downstream transformation or business use. Public validation would need a separately specified dataset and expected outputs. A conceptual diagram should therefore show the boundary between operational entities, reporting interfaces, and downstream consumers without implying ownership of the entire analytics estate.

## Research connection

This work connects directly to dataset construction and empirical validity. Missing identities, lost attribute values, and multiplied rows can alter apparent populations before a model is trained or a statistic is calculated. A future research exercise could introduce controlled extraction errors into synthetic data and study their effects on evaluation. That is a proposed experiment, not a claim of completed research, a published result, or a deployed healthcare analytics system.
