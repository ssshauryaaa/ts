import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { eventBus } from '@/lib/eventBus'

// GET /api/dossiers/[id] — single dossier with linked sightings and bounty
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const dossier = await prisma.dossier.findUnique({
    where: { id },
    include: {
      bounty: {
        include: { claimedBy: { select: { callsign: true } } },
      },
    },
  })

  if (!dossier) {
    return NextResponse.json({ error: 'Dossier not found.' }, { status: 404 })
  }

  // Find linked sightings by the dossier's callsign matching description keywords
  const sightings = await prisma.sighting.findMany({
    where: { sector: dossier.lastSector },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { agent: { select: { callsign: true } } },
  })

  return NextResponse.json({ ...dossier, sightings })
}

// PATCH /api/dossiers/[id] — update dossier status (e.g. mark cleared)
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

  const body = await request.json()
  const { status, notes } = body as { status?: string; notes?: string }

  const dossier = await prisma.dossier.findUnique({ where: { id } })
  if (!dossier) {
    return NextResponse.json({ error: 'Dossier not found.' }, { status: 404 })
  }

  const updated = await prisma.dossier.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  if (status === 'cleared') {
    const event = await prisma.event.create({
      data: {
        type: 'DOSSIER_CLEARED',
        agentId,
        payload: JSON.stringify({ dossierId: id, callsign: dossier.callsign }),
      },
    })
    eventBus.publish(event)

    // Award score to the agent
    await prisma.agent.update({
      where: { id: agentId },
      data: { score: { increment: 50 } },
    })

    // Tick compliance for the dossier's sector
    await fetch(new URL('/api/compliance/tick', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sector: dossier.lastSector, delta: 8 }),
    }).catch(() => null)
  }

  return NextResponse.json(updated)
}
