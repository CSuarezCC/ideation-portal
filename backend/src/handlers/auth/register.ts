import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { CognitoIdentityProviderClient, SignUpCommand, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider'
import { dbPut } from '../../shared/db/dynamoClient.js'
import { isValidEmail, isValidPassword } from '../../shared/utils/validation.js'
import { errorResponse, successResponse } from '../../shared/utils/errors.js'
import { ulid } from 'ulid'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}')
  const { email, password, name, department } = body

  if (!email || !isValidEmail(email)) return errorResponse('VALIDATION_ERROR', 'Valid email is required')
  if (!password || !isValidPassword(password)) return errorResponse('VALIDATION_ERROR', 'Password must be 8+ chars with uppercase, lowercase, number, and special character')
  if (!name || name.length < 2) return errorResponse('VALIDATION_ERROR', 'Name must be at least 2 characters')

  try {
    const userId = ulid()
    await cognito.send(new SignUpCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'custom:userId', Value: userId },
      ],
    }))

    const now = new Date().toISOString()
    await dbPut({
      TableName: process.env.USERS_TABLE!,
      Item: { userId, email, name, department: department || undefined, role: 'EMPLOYEE', status: 'ACTIVE', createdAt: now, updatedAt: now },
    })

    return successResponse({ userId, email, name, message: 'Please check your email for confirmation code' }, 201)
  } catch (err: any) {
    if (err.name === 'UsernameExistsException') return errorResponse('EMAIL_ALREADY_EXISTS', 'Email already registered')
    throw err
  }
}
