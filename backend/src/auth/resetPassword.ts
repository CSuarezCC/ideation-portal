import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { isValidPassword } from '../shared/utils/validation.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const { email, code, newPassword } = JSON.parse(event.body ?? '{}')
    if (!email || !code || !newPassword) return errorResponse('VALIDATION_ERROR', 'email, code, and newPassword are required')
    if (!isValidPassword(newPassword)) return errorResponse('VALIDATION_ERROR', 'Password must be 8+ chars with uppercase, lowercase, and digit')

    await cognito.send(new ConfirmForgotPasswordCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    }))

    // Invalidate all existing sessions
    await cognito.send(new AdminUserGlobalSignOutCommand({
      UserPoolId: process.env.USER_POOL_ID!,
      Username: email,
    }))

    return successResponse({ success: true })
  } catch (err: unknown) {
    const error = err as { name?: string }
    if (error.name === 'CodeMismatchException') return errorResponse('VALIDATION_ERROR', 'Invalid reset code')
    if (error.name === 'ExpiredCodeException') return errorResponse('VALIDATION_ERROR', 'Reset code has expired')
    console.error('Reset password error:', error)
    return errorResponse('INTERNAL_ERROR', 'Password reset failed')
  }
}
