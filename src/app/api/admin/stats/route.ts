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
    if (!user || user.status !== 'APPROVED' || user.role === 'USER') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get user statistics
    const userStats = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })

    // Get issue statistics
    const issueStats = await prisma.issue.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const priorityStats = await prisma.issue.groupBy({
      by: ['priority'],
      _count: {
        id: true
      }
    })

    // Get proxy statistics
    const proxyStats = await prisma.proxyLink.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    })

    const proxyStatusStats = await prisma.proxyLink.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Get chat message count
    const totalMessages = await prisma.chatMessage.count()

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    const recentIssues = await prisma.issue.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    const recentMessages = await prisma.chatMessage.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    return NextResponse.json({
      users: {
        byStatus: userStats,
        byRole: roleStats,
        recentCount: recentUsers
      },
      issues: {
        byStatus: issueStats,
        byPriority: priorityStats,
        recentCount: recentIssues
      },
      proxies: {
        byType: proxyStats,
        byStatus: proxyStatusStats
      },
      chat: {
        totalMessages,
        recentMessages
      }
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
