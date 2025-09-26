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
    if (!user || user.status !== 'APPROVED' || user.role === 'USER') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Set token for database client
    dbClient.setToken(token)

    // Get statistics from external database API
    const response = await dbClient.getStats()
    
    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    const stats = response.data

    return NextResponse.json({
      users: {
        total: stats.users.total,
        pending: stats.users.pending,
        approved: stats.users.approved
      },
      issues: {
        total: stats.issues.total,
        open: stats.issues.open,
        resolved: stats.issues.resolved
      },
      proxies: {
        total: stats.proxies.total,
        active: stats.proxies.active
      },
      chat: {
        totalMessages: stats.messages.total
      }
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
