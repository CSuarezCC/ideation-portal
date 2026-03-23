import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { refreshToken } = body
  if (!refreshToken) return errorResponse('VALIDATION_ERROR', 'refreshToken is required')

  try {
    const result = await cognito.send(new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    }))
    const auth = result.AuthenticationResult!
    return successResponse({ accessToken: auth.AccessToken, idToken: auth.IdToken })
  } catch (err: any) {
    if (err.name === 'NotAuthorizedException') return errorResponse('TOKEN_EXPIRED', 'Refresh token expired')
    throw err
  }
}
