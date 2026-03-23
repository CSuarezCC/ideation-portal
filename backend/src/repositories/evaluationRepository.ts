import type { Evaluation, AggregatedScore, AnonymizedEvaluation } from '../shared/types/index.js'
import { dbGet, dbPut, dbQuery } from '../shared/db/dynamoClient.js'
import { db } from '../shared/db/dynamoClient.js'
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const evalTable = () => process.env.EVALUATIONS_TABLE!
const scoresTable = () => process.env.AGGREGATED_SCORES_TABLE!

export const evaluationRepository = {
  async get(ideaId: string, panelMemberId: string) {
    return dbGet<Evaluation>({ TableName: evalTable(), Key: { ideaId, panelMemberId } })
  },

  async save(evaluation: Evaluation) {
    await dbPut({ TableName: evalTable(), Item: evaluation })
  },

  async listByIdea(ideaId: string) {
    return dbQuery<Evaluation>({
      TableName: evalTable(),
      KeyConditionExpression: 'ideaId = :id',
      ExpressionAttributeValues: { ':id': ideaId },
    })
  },

  async listByPanelMember(panelMemberId: string) {
    return dbQuery<Evaluation>({
      TableName: evalTable(),
      IndexName: 'panelMemberId-index',
      KeyConditionExpression: 'panelMemberId = :pm',
      ExpressionAttributeValues: { ':pm': panelMemberId },
    })
  },

  async getAggregatedScore(ideaId: string) {
    return dbGet<AggregatedScore>({ TableName: scoresTable(), Key: { ideaId } })
  },

  async listScoresByCampaign(campaignId: string) {
    return dbQuery<AggregatedScore>({
      TableName: scoresTable(),
      IndexName: 'campaignId-compositeScore-index',
      KeyConditionExpression: 'campaignId = :cid',
      ExpressionAttributeValues: { ':cid': campaignId },
      ScanIndexForward: false,
    })
  },

  async saveAggregatedScore(score: AggregatedScore) {
    await db.send(new PutCommand({
      TableName: scoresTable(),
      Item: score,
      ConditionExpression: 'attribute_not_exists(ideaId)',
    }))
  },
}
