import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

// GET /api/agents/me — return current agent from session cookie
export async function GET() {
  const cookieStore = await cookies()
  const agentId = cookieStore.get('agent_id')?.value

  if (!agentId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, callsign: true, rank: true, sector: true, score: true, createdAt: true },
  })

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found.' }, { status: 404 })
  }

  return NextResponse.json(agent)
}
