import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

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

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { phone },
          ...(email ? [{ email }] : [])
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this username, phone, or email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        phone,
        email: email || null,
        status: 'PENDING' // Requires admin approval
      },
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: 'Registration successful. Please wait for admin approval.',
      user
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
