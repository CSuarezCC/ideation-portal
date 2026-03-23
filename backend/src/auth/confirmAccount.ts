import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../shared/utils/errors.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const { email, confirmationCode } = JSON.parse(event.body ?? '{}')
    if (!email || !confirmationCode) return errorResponse('VALIDATION_ERROR', 'email and confirmationCode are required')

    await cognito.send(new ConfirmSignUpCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      Username: email,
      ConfirmationCode: confirmationCode,
    }))

    return successResponse({ success: true })
  } catch (err: unknown) {
    const error = err as { name?: string }
    if (error.name === 'CodeMismatchException') return errorResponse('VALIDATION_ERROR', 'Invalid confirmation code')
    if (error.name === 'ExpiredCodeException') return errorResponse('VALIDATION_ERROR', 'Confirmation code has expired')
    console.error('Confirm account error:', error)
    return errorResponse('INTERNAL_ERROR', 'Account confirmation failed')
  }
}
