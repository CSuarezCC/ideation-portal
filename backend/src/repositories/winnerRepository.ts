import type { WinnerRecord, WinnerAnnouncement } from '../shared/types/index.js'
import { dbGet, dbPut, dbQuery, dbUpdate } from '../shared/db/dynamoClient.js'

const table = () => process.env.WINNERS_TABLE!

export const winnerRepository = {
  async getWinners(campaignId: string) {
    return dbQuery<WinnerRecord>({
      TableName: table(),
      KeyConditionExpression: 'campaignId = :cid AND #r BETWEEN :one AND :three',
      ExpressionAttributeNames: { '#r': 'rank' },
      ExpressionAttributeValues: { ':cid': campaignId, ':one': 1, ':three': 3 },
    })
  },

  async getAnnouncement(campaignId: string) {
    return dbGet<WinnerAnnouncement>({ TableName: table(), Key: { campaignId, rank: 0 } })
  },

  async saveWinner(winner: WinnerRecord) {
    await dbPut({ TableName: table(), Item: winner })
  },

  async saveAnnouncement(announcement: WinnerAnnouncement) {
    await dbPut({ TableName: table(), Item: announcement })
  },

  async setAnnouncedAt(campaignId: string, rank: number, now: string) {
    await dbUpdate({
      TableName: table(),
      Key: { campaignId, rank },
      UpdateExpression: rank === 0 ? 'SET publishedAt = :now' : 'SET announcedAt = :now',
      ExpressionAttributeValues: { ':now': now },
    })
  },
}
