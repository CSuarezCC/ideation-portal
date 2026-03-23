import { CognitoJwtVerifier } from 'aws-jwt-verify'
import type { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerWithContextResult } from 'aws-lambda'
import type { ApiGatewayAuthorizerContext } from '../types/index.js'

// Verifier is created once at module level — JWKS cached across warm invocations
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.USER_POOL_CLIENT_ID!,
})

export async function handler(
  event: APIGatewayRequestAuthorizerEventV2
): Promise<APIGatewaySimpleAuthorizerWithContextResult<ApiGatewayAuthorizerContext>> {
  const token = event.headers?.authorization?.replace(/^Bearer\s+/i, '')

  if (!token) {
    return { isAuthorized: false, context: { userId: '', email: '', role: 'EMPLOYEE' } }
  }

  try {
    const payload = await verifier.verify(token)

    return {
      isAuthorized: true,
      context: {
        userId: payload.sub,
        email: payload.email as string,
        role: (payload['custom:role'] as string ?? 'EMPLOYEE') as ApiGatewayAuthorizerContext['role'],
      },
    }
  } catch {
    return { isAuthorized: false, context: { userId: '', email: '', role: 'EMPLOYEE' } }
  }
}
