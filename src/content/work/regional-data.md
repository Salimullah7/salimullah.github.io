---
title: "Reconciling regional data into a shared relational model"
description: "SQL transformation and reconciliation across heterogeneous membership, asset, ownership, licensing, and credential records."
category: "Data modeling"
role: "SQL transformation and reconciliation engineer at JustGo"
status: "Delivered · professional account"
order: 3
featured: true
stack:
  - "SQL"
  - "T-SQL"
  - "Entity resolution"
  - "Relational modeling"
  - "Data reconciliation"
diagram: regional
---

## Problem and context

A membership network needed to combine information maintained in regional datasets into a shared platform. The records covered people, registered assets, ownership, organizational affiliations, licenses, and credentials. Each source brought its own identifiers and representations of relationships. Consolidation required agreement about what the records meant, not simply a common set of column names.

The customer and geographic details are anonymized. My work took place at JustGo. The central modeling difficulty was that several kinds of entity could be connected in different ways: a person could have more than one affiliation, and an asset could have ownership relationships that should remain distinct from membership. Flattening those relationships into a single convenient record would make the import simpler while losing information needed by the destination system.

## My contribution

I developed SQL transformation and reconciliation workflows for the heterogeneous source data. My work addressed differences in identifiers, relationships, dates, licensing rules, and duplicate records. The historical account also identifies parent-child and many-to-many relationships as important parts of the integration problem.

This was data-engineering implementation work within a wider delivery effort. I do not claim to have defined every regional business rule, owned the source systems, or independently designed the entire destination platform. My contribution was translating inconsistent source representations into usable relational structures and investigating whether those translations preserved the intended entities and associations.

## Engineering decisions

**Keep entity types distinct.** People, assets, organizations, licenses, and credentials have different identities and lifecycles. The historical transformation work covered these interdependent records. The conceptual lesson is to preserve those distinctions when building a shared model: ownership is a relationship, a license is a domain record, and neither should silently become a property of whichever row happens to be easiest to import.

**Interpret identifiers within their source context.** The account describes differing identifiers and duplicate records across sources. A regional identifier needs interpretation before it can support a shared identity. Matching records therefore belongs alongside schema transformation. The available evidence does not establish a particular scoring method, probabilistic linkage model, or universal automatic merge rule, so none is claimed here.

**Preserve relationships when resolving duplicates.** Combining two apparent duplicates can affect memberships, ownership, and credentials attached to them. The practical question is not only whether two rows refer to the same entity, but what happens to their dependent relationships after that decision. My documented work included duplicate handling and reconciliation. The exact private decision rules and customer exceptions are outside this account.

**Make temporal and domain differences explicit.** Dates and licensing representations were among the inconsistencies addressed. Similar-looking values can have different meanings across source systems. A shared model must represent the intended meaning without silently rewriting the history. This case explains that engineering concern at a general level; it does not publish the original licensing rules or claim that a single normalization rule resolved every ambiguity.

## Validation and evidence

**Historical account.** The professional dossier records my SQL transformation and reconciliation responsibilities across the regional datasets. It supports the scope of the modeling problem and the types of inconsistency addressed. Original extracts, mapping decisions, SQL scripts, and acceptance materials are not published. The account should therefore be read as a description of delivered work rather than a publicly reproduced data-integration experiment.

**Proposed public validation.** An independently created example could use fictional regional sources with intentionally overlapping local identifiers, duplicate candidate people, and different ownership and affiliation structures. The expected shared model would be specified before running transformations. Validation would check that distinct entities stay distinct, approved matches resolve consistently, and every relationship still points to its intended person, asset, or organization.

Ambiguous records would be retained for review, with their source context visible in the example. Date interpretation and license mapping could be tested separately from identity resolution, making it possible to see which decision caused a discrepancy. This is a proposed public exercise; no synthetic dataset, mapping tool, or measured result is presented as already completed.

## Outcome and limitations

The delivered contribution was a set of SQL transformation and reconciliation workflows supporting consolidation of heterogeneous regional data. The attributable achievement is handling interdependent domain information across inconsistent sources. This account does not attach production volumes, accuracy percentages, or claims that all duplicates were resolved automatically.

A public conceptual diagram can explain the distinction between regional sources, shared entities, and preserved relationships. It cannot establish that the private migration had a particular architecture or prove its historical correctness. Further public evidence would come from an independent example with explicit expected mappings and visible unresolved cases.

## Research connection

This work connects to heterogeneous data integration, provenance, and uncertainty in entity resolution. Those concerns also arise when research datasets combine records from different institutions or collection processes. A useful extension would compare conservative matching with more permissive matching and measure which relationships each policy preserves or damages. That remains a proposed research direction; this case does not claim a completed ML linkage model or experience deploying a clinical data system.
