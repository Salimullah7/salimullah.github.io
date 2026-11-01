---
title: "When a successful query leaves people out"
description: "Why data completeness needs a population definition, not just a query that runs without errors."
date: "1 November 2026"
category: "Data quality"
---

## The missing population

A report returns a plausible set of membership records. The query completes, the columns look right, and the consumer can import the output. None of those checks tells us whether the report includes the people it was meant to represent.

Consider a synthetic dataset with three people. Two have an active membership, while the third has a pending application. An inner join between people and active memberships returns two rows. That is correct for “people with an active membership.” It is incomplete for “people who need a decision about their application.”

The error lives in the population definition, not necessarily in the SQL syntax.

## Define the denominator first

Before writing an extraction query, describe which entities are eligible for inclusion and why. Keep this description separate from the join implementation. It becomes the basis for checking whether a technical choice has silently changed the question.

In this example, the expected population is all three people. A left join preserves the third person, but it still needs an explicit representation of the absent membership. Replacing a missing status with “inactive” would create a different interpretation. Absence and inactivity are not interchangeable.

## Check relationships and coverage

Useful checks ask more than how many rows were returned:

- Which eligible source IDs have no representation in the output?
- Which source entities produce multiple rows because of a one-to-many relationship?
- Which fields are absent because no related record exists?
- Which records were deliberately excluded, and under what rule?

If a person has several memberships, output row counts can exceed person counts while some people remain missing. Comparing only totals can hide both problems at once. Compare identifiers and cardinalities against the intended entity grain.

## Make exclusions inspectable

An extraction interface should make its meaning available to its consumer. State its entity grain, inclusion rules, treatment of missing relationships, and expected update behaviour. A short definition can prevent the warehouse consumer from treating “one row per membership” as “one row per person.”

This matters in research as well. A model can learn from a technically valid table that has systematically excluded a population. Completeness checks do not prove representativeness, but they make one class of selection error easier to see.
