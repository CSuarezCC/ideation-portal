import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'

const client = new EventBridgeClient({ region: process.env.REGION })

const EVENT_SOURCE = 'ideation-portal'

export async function publishEvent(detailType: string, detail: unknown): Promise<void> {
  await client.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: process.env.EVENT_BUS_NAME,
          Source: EVENT_SOURCE,
          DetailType: detailType,
          Detail: JSON.stringify(detail),
        },
      ],
    })
  )
}
