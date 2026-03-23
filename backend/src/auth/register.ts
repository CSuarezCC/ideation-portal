import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { dbPut } from '../shared/db/dynamoClient.js'
import { errorResponse, successResponse } from '../shared/utils/errors.js'
import { isValidEmail, isValidPassword } from '../shared/utils/validation.js'
import { withRetry } from '../shared/utils/retry.js'
import type { User } from '../shared/types/index.js'

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const body = JSON.parse(event.body ?? '{}')
    const { email, password, name, department } = body

    if (!email || !isValidEmail(email)) return errorResponse('VALIDATION_ERROR', 'Valid email is required')
    if (!password || !isValidPassword(password)) return errorResponse('VALIDATION_ERROR', 'Password must be 8+ chars with uppercase, lowercase, and digit')
    if (!name?.trim()) return errorResponse('VALIDATION_ERROR', 'Name is required')

    // Create user in Cognito (AdminCreateUser + set permanent password)
    const createResult = await cognito.send(new AdminCreateUserCommand({
      UserPoolId: process.env.USER_POOL_ID!,
      Username: email,
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS', // We handle confirmation ourselves
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'false' },
        { Name: 'name', Value: name },
        { Name: 'custom:role', Value: 'EMPLOYEE' },
      ],
    }))

    const userId = createResult.User?.Attributes?.find((a) => a.Name === 'sub')?.Value
    if (!userId) throw new Error('Failed to get userId from Cognito')

    // Set permanent password so user can log in after confirmation
    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID!,
      Username: email,
      Password: password,
      Permanent: true,
    }))

    // Ensure role attribute is set
    await cognito.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.USER_POOL_ID!,
      Username: email,
      UserAttributes: [{ Name: 'custom:role', Value: 'EMPLOYEE' }],
    }))

    const now = new Date().toISOString()
    const user: User = {
      userId,
      email,
      name,
      department: department ?? undefined,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }

    await withRetry(() =>
      dbPut({ TableName: process.env.USERS_TABLE!, Item: user })
    )

    return successResponse({ userId, message: 'Registration successful. Please check your email to confirm your account.' }, 201)
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string }
    if (error.name === 'UsernameExistsException') return errorResponse('EMAIL_ALREADY_EXISTS', 'An account with this email already exists')
    console.error('Register error:', error)
    return errorResponse('INTERNAL_ERROR', 'Registration failed')
  }
}
