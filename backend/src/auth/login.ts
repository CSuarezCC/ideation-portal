import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../shared/utils/errors.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const { email, password } = JSON.parse(event.body ?? '{}')
    if (!email || !password) return errorResponse('VALIDATION_ERROR', 'Email and password are required')

    const result = await cognito.send(new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    }))

    const tokens = result.AuthenticationResult
    if (!tokens?.AccessToken || !tokens.RefreshToken || !tokens.IdToken) {
      return errorResponse('INTERNAL_ERROR', 'Authentication failed')
    }

    return successResponse({
      accessToken: tokens.AccessToken,
      refreshToken: tokens.RefreshToken,
      idToken: tokens.IdToken,
    })
  } catch (err: unknown) {
    const error = err as { name?: string }
    if (error.name === 'NotAuthorizedException') return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password')
    if (error.name === 'UserNotConfirmedException') return errorResponse('ACCOUNT_NOT_CONFIRMED', 'Please confirm your account before logging in')
    if (error.name === 'UserNotFoundException') return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password')
    console.error('Login error:', error)
    return errorResponse('INTERNAL_ERROR', 'Login failed')
  }
}
