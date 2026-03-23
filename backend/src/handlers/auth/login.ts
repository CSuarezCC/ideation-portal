import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { email, password } = body
  if (!email || !password) return errorResponse('VALIDATION_ERROR', 'Email and password are required')

  try {
    const result = await cognito.send(new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    }))
    const auth = result.AuthenticationResult!
    return successResponse({ accessToken: auth.AccessToken, refreshToken: auth.RefreshToken, idToken: auth.IdToken })
  } catch (err: any) {
    if (err.name === 'NotAuthorizedException') return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password')
    if (err.name === 'UserNotConfirmedException') return errorResponse('ACCOUNT_NOT_CONFIRMED', 'Please confirm your account first')
    if (err.name === 'UserNotFoundException') return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password')
    throw err
  }
}
