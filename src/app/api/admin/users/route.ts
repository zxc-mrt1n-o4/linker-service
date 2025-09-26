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
    if (!user || user.status !== 'APPROVED' || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Set token for database client
    dbClient.setToken(token)

    // Get users from external database API
    const response = await dbClient.getUsers()
    
    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    return NextResponse.json({ users: response.data.users })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}