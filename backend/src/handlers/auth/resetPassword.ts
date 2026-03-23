import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider'
import { isValidPassword } from '../../shared/utils/validation.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { email, confirmationCode, newPassword } = body
  if (!email || !confirmationCode || !newPassword) return errorResponse('VALIDATION_ERROR', 'Email, confirmation code, and new password are required')
  if (!isValidPassword(newPassword)) return errorResponse('VALIDATION_ERROR', 'Password must be 8+ chars with uppercase, lowercase, number, and special character')

  try {
    await cognito.send(new ConfirmForgotPasswordCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID!, Username: email,
      ConfirmationCode: confirmationCode, Password: newPassword,
    }))
    return successResponse({ message: 'Password reset successfully' })
  } catch (err: any) {
    if (err.name === 'CodeMismatchException') return errorResponse('VALIDATION_ERROR', 'Invalid confirmation code')
    if (err.name === 'ExpiredCodeException') return errorResponse('VALIDATION_ERROR', 'Confirmation code expired')
    throw err
  }
}
