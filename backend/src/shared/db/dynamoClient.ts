import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteCommand,
  type GetCommandInput,
  type PutCommandInput,
  type UpdateCommandInput,
  type DeleteCommandInput,
  type QueryCommandInput,
  type ScanCommandInput,
  type BatchWriteCommandOutput,
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: process.env.REGION })

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
})

export async function dbGet<T>(params: GetCommandInput): Promise<T | undefined> {
  const result = await db.send(new GetCommand(params))
  return result.Item as T | undefined
}

export async function dbPut(params: PutCommandInput): Promise<void> {
  await db.send(new PutCommand(params))
}

export async function dbUpdate(params: UpdateCommandInput): Promise<void> {
  await db.send(new UpdateCommand(params))
}

export async function dbDelete(params: DeleteCommandInput): Promise<void> {
  await db.send(new DeleteCommand(params))
}

export async function dbQuery<T>(params: QueryCommandInput): Promise<{ items: T[]; lastKey?: Record<string, unknown> }> {
  const result = await db.send(new QueryCommand(params))
  return {
    items: (result.Items ?? []) as T[],
    lastKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
  }
}

export async function dbScan<T>(params: ScanCommandInput): Promise<{ items: T[]; lastKey?: Record<string, unknown> }> {
  const result = await db.send(new ScanCommand(params))
  return {
    items: (result.Items ?? []) as T[],
    lastKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
  }
}

export async function dbBatchWrite(tableName: string, items: Record<string, unknown>[]): Promise<void> {
  const chunks: Record<string, unknown>[][] = []
  for (let i = 0; i < items.length; i += 25) chunks.push(items.slice(i, i + 25))

  for (const chunk of chunks) {
    let unprocessed: Record<string, unknown>[] | undefined = chunk
    while (unprocessed && unprocessed.length > 0) {
      const result: BatchWriteCommandOutput = await db.send(new BatchWriteCommand({
        RequestItems: { [tableName]: unprocessed.map(item => ({ PutRequest: { Item: item } })) },
      }))
      const failed: Record<string, unknown>[] | undefined = result.UnprocessedItems?.[tableName]?.map((r: { PutRequest?: { Item?: Record<string, unknown> } }) => r.PutRequest!.Item as Record<string, unknown>)
      unprocessed = failed
    }
  }
}
