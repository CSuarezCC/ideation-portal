import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { email, confirmationCode } = body
  if (!email || !confirmationCode) return errorResponse('VALIDATION_ERROR', 'Email and confirmation code are required')

  try {
    await cognito.send(new ConfirmSignUpCommand({ ClientId: process.env.USER_POOL_CLIENT_ID!, Username: email, ConfirmationCode: confirmationCode }))
    return successResponse({ message: 'Account confirmed successfully' })
  } catch (err: any) {
    if (err.name === 'CodeMismatchException') return errorResponse('VALIDATION_ERROR', 'Invalid confirmation code')
    if (err.name === 'ExpiredCodeException') return errorResponse('VALIDATION_ERROR', 'Confirmation code expired')
    throw err
  }
}
