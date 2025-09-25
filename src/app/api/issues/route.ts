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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: any = {}
    
    // Regular users can only see their own issues
    // if (user.role === 'USER') {
    //   where.userId = user.id
    // }
    
    // Filter by status if provided
    if (status && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      where.status = status
    }

    const issues = await prisma.issue.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    const total = await prisma.issue.count({ where })

    return NextResponse.json({
      issues,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    })

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

    const { title, description, priority } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    if (title.length > 200) {
      return NextResponse.json({ error: 'Title too long (max 200 characters)' }, { status: 400 })
    }

    if (description.length > 2000) {
      return NextResponse.json({ error: 'Description too long (max 2000 characters)' }, { status: 400 })
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }

    const issue = await prisma.issue.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        priority: priority || 'MEDIUM',
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({ issue })

  } catch (error) {
    console.error('Create issue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
