import type { EventBridgeEvent } from 'aws-lambda'
import { recognitionService } from '../../services/recognitionService.js'
export async function handler(event: EventBridgeEvent<string, { campaignId: string; campaignName: string }>): Promise<void> {
  await recognitionService.processWinners(event.detail.campaignId, event.detail.campaignName)
}
