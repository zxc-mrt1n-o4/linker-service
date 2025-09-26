import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db-client'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const before = searchParams.get('before') // For pagination

    // Set token for database client
    dbClient.setToken(token)

    // Get messages from external database API
    const response = await dbClient.getMessages(limit, before)
    
    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    return NextResponse.json({
      messages: response.data.messages,
      hasMore: response.data.hasMore
    })

  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 })
    }

    // Set token for database client
    dbClient.setToken(token)

    // Create message using external database API
    const response = await dbClient.createMessage(content.trim())
    
    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    return NextResponse.json({ message: response.data.message })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
