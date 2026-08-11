import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { eventBus } from '@/lib/eventBus'

// POST /api/bounties/[id]/claim — claim an open bounty
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const agentId = cookieStore.get('agent_id')?.value

  if (!agentId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const bounty = await prisma.bounty.findUnique({
    where: { id },
    include: { dossier: { select: { callsign: true } } },
  })

  if (!bounty) {
    return NextResponse.json({ error: 'Bounty not found.' }, { status: 404 })
  }

  if (bounty.status !== 'open') {
    return NextResponse.json({ error: `Bounty is already ${bounty.status}.` }, { status: 409 })
  }

  const [updated] = await prisma.$transaction([
    prisma.bounty.update({
      where: { id },
      data: {
        status: 'claimed',
        claimedById: agentId,
        claimedAt: new Date(),
      },
    }),
    // Award points to the agent
    prisma.agent.update({
      where: { id: agentId },
      data: { score: { increment: Math.round(bounty.reward / 100) } },
    }),
  ])

  const event = await prisma.event.create({
    data: {
      type: 'BOUNTY_CLAIMED',
      agentId,
      payload: JSON.stringify({
        bountyId: id,
        agentId,
        reward: bounty.reward,
        targetCallsign: bounty.dossier.callsign,
      }),
    },
  })
  eventBus.publish(event)

  return NextResponse.json(updated)
}
