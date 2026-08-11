import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { eventBus } from '@/lib/eventBus'

// PATCH /api/bounties/[id] — mark bounty resolved
export async function PATCH(
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
    include: { dossier: true },
  })

  if (!bounty) {
    return NextResponse.json({ error: 'Bounty not found.' }, { status: 404 })
  }

  if (bounty.status === 'resolved') {
    return NextResponse.json({ error: 'Bounty already resolved.' }, { status: 409 })
  }

  const updated = await prisma.bounty.update({
    where: { id },
    data: { status: 'resolved' },
  })

  const event = await prisma.event.create({
    data: {
      type: 'BOUNTY_RESOLVED',
      agentId,
      payload: JSON.stringify({ bountyId: id }),
    },
  })
  eventBus.publish(event)

  // Tick compliance for the dossier's sector
  await fetch(new URL('/api/compliance/tick', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sector: bounty.dossier.lastSector, delta: 5 }),
  }).catch(() => null)

  return NextResponse.json(updated)
}
