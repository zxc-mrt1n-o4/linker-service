import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const type = searchParams.get('type')

    // Build the query
    const where: any = {}

    // Regular users only see ACTIVE proxies
    if (user.role === 'USER') {
      where.status = 'ACTIVE'
    }

    // Filter by type if specified
    if (type && ['FANCY', 'THIRD_PARTY'].includes(type)) {
      where.type = type
    }

    const proxies = await prisma.proxyLink.findMany({
      where,
      orderBy: [
        { type: 'asc' },      // FANCY first
        { createdAt: 'desc' } // newest first
      ]
    })

    return NextResponse.json({ proxies })

  } catch (error) {
    console.error('Get proxies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// STATUS CHANGE, ONLY ADMINS & SUPER ADMINS CAN DO THIS
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user || user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { status } = await request.json()
    const resolvedParams = await params
    const updatedProxy = await prisma.proxyLink.update({
      where: { id: resolvedParams.id },
      data: { status }
    })

    return NextResponse.json({ success: true, proxy: updatedProxy })
  } catch (error) {
    console.error('Update proxy error:', error)
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

    // Only admins can create proxy links
    if (user.role === 'USER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, url, description, type } = await request.json()

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (!['FANCY', 'THIRD_PARTY'].includes(type)) {
      return NextResponse.json({ error: 'Invalid proxy type' }, { status: 400 })
    }

    const proxy = await prisma.proxyLink.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        description: description?.trim() || null,
        type
      }
    })

    return NextResponse.json({ proxy })

  } catch (error) {
    console.error('Create proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user || user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const resolvedParams = await params
    const proxy = await prisma.proxyLink.delete({ where: { id: resolvedParams.id } })
    return NextResponse.json({ success: true, proxy })
  } catch (error) {
    console.error('Delete proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}