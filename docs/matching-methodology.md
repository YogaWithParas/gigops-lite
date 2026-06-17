# GigOps Lite Task Assignment Methodology

## Overview

GigOps Lite assigns tasks using a transparent score model. The goal is to maximize quality and delivery reliability while keeping the assignment logic explainable.

## Scoring Signals

Each candidate agent is evaluated with weighted signals:

- skill fit to task requirements
- historical quality performance
- current availability state
- workload headroom
- priority sensitivity

## Baseline Formula

At a high level:

`totalScore = skillFit + quality + availability + workload + priorityAdjustment`

Each term is normalized to a bounded range so no single signal dominates by accident.

## Operational Guardrails

The scorer is constrained by hard checks before ranking:

- required skills must overlap
- offline workers are excluded
- overloaded workers are de-prioritized or blocked

These checks prevent obviously bad assignments even when scores are close.

## Human Review Points

Operations can override automated ranking when:

- a client has special handling requirements
- QA has flagged recent risk on a worker
- surge load requires manual redistribution

Overrides should generate audit entries to preserve traceability.

## Why Weighted Scoring in V1

Weighted scoring is preferred over opaque models in the prototype because it is:

- easy to inspect and tune
- straightforward to test
- resilient to sparse synthetic history

## Future Enhancements

Planned improvements include:

- per-client weighting profiles
- feedback loops from QA outcomes
- SLA-aware dynamic reprioritization
- event-driven reassignment on risk triggers

## Summary

The methodology keeps assignment fast, transparent, and controllable. Automation improves throughput, while human overrides and audit trails preserve operational accountability.
