import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../shared/utils/errors.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const { email } = JSON.parse(event.body ?? '{}')
    if (!email) return errorResponse('VALIDATION_ERROR', 'email is required')

    // Always return success — do not reveal if email exists
    try {
      await cognito.send(new ForgotPasswordCommand({
        ClientId: process.env.USER_POOL_CLIENT_ID!,
        Username: email,
      }))
    } catch {
      // Swallow errors to prevent email enumeration
    }

    return successResponse({ message: 'If the email exists, a reset code has been sent.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    return errorResponse('INTERNAL_ERROR', 'Request failed')
  }
}
