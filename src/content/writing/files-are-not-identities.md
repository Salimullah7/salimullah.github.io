---
title: "A filename is a label, not an identity"
description: "A small example of why a document transfer must preserve the relationship between an object and its owner."
date: "1 November 2026"
category: "Data integrity"
---

## A collision that looks ordinary

Two fictional members each upload a document called `certificate.pdf`. If a transfer process uses the filename as its only lookup key, both documents compete for the same identity. A file transfer can report success while associating the wrong document with a destination record.

The problem is not that people chose an unreasonable filename. The problem is that a human-readable label was asked to do the work of a stable identifier.

## Preserve the association

A safer conceptual mapping keeps separate fields for the source record ID, source object ID, destination object ID, and destination record ID. The filename remains display metadata. A newly generated identifier can distinguish destination objects, but uniqueness alone is insufficient: the mapping still needs to point each object to its intended owner.

For example, source document `DOC-A` belongs to fictional member `PERSON-A`; source document `DOC-B` belongs to `PERSON-B`. Both can retain the display name `certificate.pdf` while receiving different destination object IDs. Verification checks the full association rather than simply confirming that two objects exist.

## Decide what each check proves

Object counts establish quantity. Identifier uniqueness establishes separation. Relationship checks establish which record an object belongs to. Content checks can establish properties of the transferred bytes. Those are different questions, and no single successful check answers all of them.

Hashing can be useful when verifying byte equality, but it does not establish ownership. Two records may legitimately refer to identical content, and a perfectly copied file may still be attached to the wrong record. This is a general design observation, not a claim that a particular historical implementation used hashing.

## Keep recovery in the model

When a transfer is retried, a stable mapping helps distinguish an already-transferred object from a new one. A robust design would define how it records partial progress, reconciles ambiguous mappings, and avoids applying an uncertain association automatically.

These are useful questions for any migration involving attachments. The central test remains simple: can the destination explain where this object came from and why it belongs to this record?
