import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db-client'

export async function POST(request: NextRequest) {
  try {
    const { username, password, phone, email } = await request.json()

    // Validate required fields
    if (!username || !password || !phone) {
      return NextResponse.json(
        { error: 'Username, password, and phone are required' },
        { status: 400 }
      )
    }

    // Create user using external database API
    const createResponse = await dbClient.createUser({
      username,
      password,
      phone,
      email,
      role: 'USER'
    })

    if (createResponse.error) {
      return NextResponse.json(
        { error: createResponse.error },
        { status: 409 }
      )
    }

    const user = createResponse.data.user

    return NextResponse.json({
      message: 'Registration successful. Please wait for admin approval.',
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
