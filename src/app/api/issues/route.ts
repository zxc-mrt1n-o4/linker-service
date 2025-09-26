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

    // Set token for database client
    dbClient.setToken(token)

    // Get issues from external database API
    const response = await dbClient.getIssues()
    
    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    if (!response.data) {
      return NextResponse.json({ error: 'No data received' }, { status: 500 })
    }

    return NextResponse.json({ issues: response.data.issues })

  } catch (error) {
    console.error('Get issues error:', error)
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

    const { title, description, priority = 'MEDIUM' } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Set token for database client
    dbClient.setToken(token)

    // Create issue using external database API
    const response = await dbClient.createIssue({
      title,
      description,
      priority
    })

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    if (!response.data) {
      return NextResponse.json({ error: 'No data received' }, { status: 500 })
    }

    return NextResponse.json({ issue: response.data.issue })

  } catch (error) {
    console.error('Create issue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}