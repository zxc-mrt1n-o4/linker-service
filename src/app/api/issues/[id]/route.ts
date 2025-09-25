import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Only admins can update issue status
    if (user.role === 'USER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { status, priority } = await request.json()

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
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
    console.error('Update issue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if user owns the issue or is an admin
    const issue = await prisma.issue.findUnique({
      where: { id }
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    if (issue.userId !== user.id && user.role === 'USER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    await prisma.issue.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Issue deleted successfully' })

  } catch (error) {
    console.error('Delete issue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
