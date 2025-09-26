import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db-client'
import { getUserFromToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.status !== 'APPROVED' || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { id } = await params
    const { status, role } = await request.json()

    // Set token for database client
    dbClient.setToken(token)

    // Update user using external database API
    const response = await dbClient.updateUser(id, {
      status,
      role
    })

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    return NextResponse.json({ user: response.data.user })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}