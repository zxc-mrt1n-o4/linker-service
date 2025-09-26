import { NextRequest, NextResponse } from 'next/server'
import { dbClient } from '@/lib/db-client'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get proxies from external database API
    const response = await dbClient.getProxies()
    
    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    if (!response.data) {
      return NextResponse.json({ error: 'No data received' }, { status: 500 })
    }

    return NextResponse.json({ proxies: response.data.proxies })

  } catch (error) {
    console.error('Get proxies error:', error)
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
    if (!user || user.status !== 'APPROVED' || user.role === 'USER') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { name, url, description, type = 'THIRD_PARTY' } = await request.json()

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
    }

    // Set token for database client
    dbClient.setToken(token)

    // Create proxy using external database API
    const response = await dbClient.createProxy({
      name,
      url,
      description,
      type
    })

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    if (!response.data) {
      return NextResponse.json({ error: 'No data received' }, { status: 500 })
    }

    return NextResponse.json({ proxy: response.data.proxy })

  } catch (error) {
    console.error('Create proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}