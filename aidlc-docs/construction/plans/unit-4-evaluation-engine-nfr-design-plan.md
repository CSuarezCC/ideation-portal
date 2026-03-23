# NFR Design Plan — Unit 4: Evaluation Engine

## Plan Steps

- [x] Step 1: Define NFR design patterns (blind scoring, idempotent aggregation, evaluation queue join)
- [x] Step 2: Define logical components (handlers, services, frontend pages)

## Questions

**Q1**: For the idempotent aggregation guard, if a race condition causes two simultaneous submit handlers to both detect "all scored", the conditional write ensures only one succeeds. Should the second one silently succeed (return the existing aggregation) or return an error?

A) Silently succeed — catch ConditionalCheckFailedException, read and return existing AggregatedScore
B) Return error to the second caller

[Answer]: A
