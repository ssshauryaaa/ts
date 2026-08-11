import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { eventBus } from '@/lib/eventBus'

// POST /api/agents — create or fetch agent by callsign, set session cookie
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { callsign } = body as { callsign?: string }

  if (!callsign || callsign.trim().length < 2) {
    return NextResponse.json({ error: 'Callsign must be at least 2 characters.' }, { status: 400 })
  }

  const normalized = callsign.trim().toUpperCase()

  let agent = await prisma.agent.findUnique({ where: { callsign: normalized } })
  const isNew = !agent

  if (!agent) {
    agent = await prisma.agent.create({
      data: { callsign: normalized },
    })
  }

  // Emit AGENT_JOINED event (even for returning agents — marks a new login)
  const event = await prisma.event.create({
    data: {
      type: 'AGENT_JOINED',
      agentId: agent.id,
      payload: JSON.stringify({ agentId: agent.id, callsign: agent.callsign, isNew }),
    },
  })
  eventBus.publish(event)

  const cookieStore = await cookies()
  cookieStore.set('agent_id', agent.id, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  })

  return NextResponse.json({ agent, isNew })
}

// GET /api/agents — list all agents (for admin/debug)
export async function GET() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, callsign: true, rank: true, sector: true, score: true, createdAt: true },
  })
  return NextResponse.json(agents)
}
