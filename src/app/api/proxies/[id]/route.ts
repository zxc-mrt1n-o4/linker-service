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
    if (!user || user.status !== 'APPROVED' || user.role === 'USER') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { id } = await params
    const { name, url, description, type, status } = await request.json()

    // Set token for database client
    dbClient.setToken(token)

    // Update proxy using external database API
    const response = await dbClient.updateProxy(id, {
      name,
      url,
      description,
      type,
      status
    })

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    if (!response.data) {
      return NextResponse.json({ error: 'No data received' }, { status: 500 })
    }

    return NextResponse.json({ proxy: response.data.proxy })

  } catch (error) {
    console.error('Update proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}