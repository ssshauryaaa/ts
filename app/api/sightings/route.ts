import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { eventBus } from '@/lib/eventBus'

// GET /api/sightings — list sightings, filterable by ?sector= &threat=
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const sector = searchParams.get('sector')
  const threat = searchParams.get('threat')

  const sightings = await prisma.sighting.findMany({
    where: {
      ...(sector ? { sector } : {}),
      ...(threat ? { threatLevel: threat } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      agent: { select: { callsign: true } },
    },
  })

  return NextResponse.json(sightings)
}

// POST /api/sightings — report a new sighting
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const agentId = cookieStore.get('agent_id')?.value

  if (!agentId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const body = await request.json()
  const { sector, description, threatLevel, x, y } = body as {
    sector?: string
    description?: string
    threatLevel?: string
    x?: number
    y?: number
  }

  if (!sector || !description || !threatLevel) {
    return NextResponse.json({ error: 'sector, description, and threatLevel are required.' }, { status: 400 })
  }

  const sighting = await prisma.sighting.create({
    data: {
      sector,
      description,
      threatLevel,
      x: x ?? Math.random() * 800 + 100,
      y: y ?? Math.random() * 500 + 100,
      reportedBy: agentId,
    },
    include: { agent: { select: { callsign: true } } },
  })

  const event = await prisma.event.create({
    data: {
      type: 'SIGHTING_REPORTED',
      agentId,
      payload: JSON.stringify({
        sightingId: sighting.id,
        sector: sighting.sector,
        threatLevel: sighting.threatLevel,
      }),
    },
  })
  eventBus.publish(event)

  return NextResponse.json(sighting, { status: 201 })
}
