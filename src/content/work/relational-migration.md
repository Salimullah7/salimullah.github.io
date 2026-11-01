---
title: "Migrating relationships, not just rows"
description: "A professional account of transforming interconnected legacy membership data while preserving identity, dependencies, and historical meaning."
category: "Data engineering"
role: "Primary hands-on migration engineer at JustGo"
status: "Delivered · professional account"
order: 1
featured: true
stack:
  - "SQL"
  - "T-SQL"
  - "Relational modeling"
  - "ETL"
diagram: migration
---

## Problem and context

A membership organization needed to move historical information into a different enterprise platform. The difficult part was the relationship between records: people belonged to organizations, memberships referred to people and membership types, and credentials carried their own associations and historical states. A successful import had to preserve those connections while translating between different representations of the same domain.

This work took place at JustGo. The customer and source structures are anonymized here. The account focuses on the engineering problem rather than the size of the organization. Record counts alone would obscure the central constraint: a row can load successfully and still describe the wrong relationship. Moving the data therefore required transformation, dependency handling, and reconciliation alongside the mechanics of bulk import.

## My contribution

I was the main hands-on engineer for the substantial migration implementation. My work included T-SQL transformations, source-to-target mapping, data cleaning, bulk-import preparation, relational dependency handling, and investigation of discrepancies during reconciliation. Senior colleagues handled much of the external customer communication. That division matters because implementation responsibility and overall program ownership are different contributions.

My responsibility was to make source information usable within the destination model. This involved working through how identifiers, statuses, and dependent entities should be represented, then investigating cases where the transformed output did not align with the intended meaning. This account describes that implementation work without reproducing employer code, source records, or a customer-specific schema.

## Engineering decisions

**Make relationships part of the mapping.** The migration involved related entities rather than independent tables. An identifier mapping is meaningful only when dependent records resolve to the intended destination entity. My transformation work therefore included the relationships between members, organizations, memberships, and credentials. The general principle is that a mapping should explain both where a value goes and what it continues to refer to.

**Treat dependency order as a correctness concern.** Bulk preparation had to account for relational dependencies. A destination record can be syntactically valid while its parent or referenced entity is unavailable or incorrectly mapped. Explaining those dependencies makes the migration easier to reason about than treating every failed import as an isolated formatting problem. This is a conceptual explanation of the work, not a published execution sequence from the original system.

**Separate cleanup from interpretation.** Cleaning a representation and changing its meaning are different operations. Dates, status values, and legacy identifiers need source-to-target interpretation; apparently untidy data should not be silently converted into a more convenient business history. The historical account supports cleaning, mapping, and discrepancy investigation. It does not establish a particular automated approval mechanism for ambiguous records.

These decisions also shaped how I understood reconciliation. Loading every prepared row would not, by itself, establish that the membership history remained coherent. Investigating an unmatched relationship or unexpected state was part of the migration task rather than a separate reporting exercise.

## Validation and evidence

**Historical account.** My professional account describes the transformation implementation and reconciliation work. A retrospective career dossier also records these responsibilities. These are evidence of the reported work and contribution; they are not an independently reproducible public migration benchmark. The original mapping documents, scripts, execution logs, and customer data are not published with this case.

**Proposed public validation.** An independently created demonstration could use fictional people, organizations, memberships, and credentials. Deliberately incomplete references and conflicting identifiers would make the failure cases visible. Checks would compare the expected destination entities with the actual output, verify that dependent references resolve, and account for accepted, rejected, and unresolved source records. A missing relationship should remain an explicit unresolved case rather than disappear from a successful-row total.

That demonstration is a proposed validation exercise. It has not been built or measured as part of this account. Any accompanying diagram should show a generic relationship-preserving transformation, not claim to reconstruct the customer architecture.

## Outcome and limitations

The historical outcome was a delivered migration implementation, including transformation and support for reconciliation. The strongest attributable result is the engineering work needed to translate interconnected legacy records into the destination model. This case makes no claim about processing speed, commercial value, error-free execution, or independently verified production volume.

The public evidence is necessarily narrower than the original delivery context. A synthetic example could demonstrate the reasoning and validation method, but it could not certify the correctness of the historical migration. Keeping those claims separate makes both the professional account and a future public artifact more useful to review.

## Research connection

This work connects to data provenance, entity resolution, and the preservation of meaning across schema changes. It also informs how I think about machine-learning datasets: an apparently complete table can still contain broken identities or misleading relationships. A research extension would study how different reconciliation rules reveal those failures using controlled synthetic data. That is a future investigation, not a claim that this migration included an ML system or a published experiment.
