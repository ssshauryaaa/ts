import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { eventBus } from '@/lib/eventBus'

// GET /api/comms/[channel] — message history for a channel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params
  const { searchParams } = request.nextUrl
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))

  const messages = await prisma.message.findMany({
    where: { channel },
    orderBy: { createdAt: 'asc' },
    take: limit,
    include: { agent: { select: { callsign: true } } },
  })

  return NextResponse.json(messages)
}

// POST /api/comms/[channel] — post a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params
  const cookieStore = await cookies()
  const agentId = cookieStore.get('agent_id')?.value

  if (!agentId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const body = await request.json()
  const { content } = body as { content?: string }

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'content is required.' }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      channel,
      agentId,
      content: content.trim(),
    },
    include: { agent: { select: { callsign: true } } },
  })

  const event = await prisma.event.create({
    data: {
      type: 'MESSAGE_SENT',
      agentId,
      payload: JSON.stringify({
        channel,
        agentId,
        callsign: message.agent.callsign,
        content: message.content,
        messageId: message.id,
      }),
    },
  })
  eventBus.publish(event)

  return NextResponse.json(message, { status: 201 })
}
