import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { email } = body
  if (!email) return errorResponse('VALIDATION_ERROR', 'Email is required')

  try {
    await cognito.send(new ForgotPasswordCommand({ ClientId: process.env.USER_POOL_CLIENT_ID!, Username: email }))
  } catch { /* swallow to prevent user enumeration */ }
  return successResponse({ message: 'If the email exists, a reset code has been sent' })
}
