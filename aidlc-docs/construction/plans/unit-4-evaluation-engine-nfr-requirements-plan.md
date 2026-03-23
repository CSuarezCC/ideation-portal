# NFR Requirements Plan — Unit 4: Evaluation Engine

## Plan Steps

- [x] Step 1: Define performance requirements for evaluation operations
- [x] Step 2: Define scalability, availability, security, reliability, maintainability requirements
- [x] Step 3: Document tech stack decisions and DynamoDB access patterns

## Questions

### Performance

**Q1**: For the evaluation queue (getIdeasForEvaluation), this requires joining Ideas + Evaluations data. Acceptable approach?

A) Two DynamoDB queries (ideas by campaign, evaluations by panelMember) joined in Lambda — target < 1s
B) Denormalize evaluation status onto the Ideas table for single-query reads
C) Pre-compute evaluation queue as a materialized view

[Answer]: A

**Q2**: Aggregation runs synchronously inside the submitEvaluation handler (when last panel member submits). This adds latency to that one request. Acceptable?

A) Yes, synchronous is fine — aggregation is just math + 2 DynamoDB writes, should be < 500ms extra
B) No, trigger aggregation asynchronously via EventBridge to keep submit response fast

[Answer]: A

**Q3**: For the evaluation summary with anonymized individual scores + justifications — should this data be stored pre-computed in AggregatedScores, or assembled at query time from Evaluations table?

A) Pre-computed and stored in AggregatedScore (faster reads, slightly larger record)
B) Assembled at query time from Evaluations table (smaller storage, extra query)

[Answer]: A
