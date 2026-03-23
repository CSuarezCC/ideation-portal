import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../shared/utils/errors.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const { refreshToken } = JSON.parse(event.body ?? '{}')
    if (!refreshToken) return errorResponse('VALIDATION_ERROR', 'refreshToken is required')

    const result = await cognito.send(new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    }))

    const tokens = result.AuthenticationResult
    if (!tokens?.AccessToken) return errorResponse('TOKEN_EXPIRED', 'Refresh token is invalid or expired')

    return successResponse({ accessToken: tokens.AccessToken })
  } catch (err: unknown) {
    const error = err as { name?: string }
    if (error.name === 'NotAuthorizedException') return errorResponse('TOKEN_EXPIRED', 'Refresh token is invalid or expired')
    console.error('Refresh token error:', error)
    return errorResponse('INTERNAL_ERROR', 'Token refresh failed')
  }
}
