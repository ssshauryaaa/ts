import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { eventBus } from '@/lib/eventBus'

// POST /api/compliance/tick — nudge a sector's compliance index
// Body: { sector: string, delta?: number }
// Called internally by other routes when dossiers/bounties are resolved.
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { sector, delta = 5 } = body as { sector?: string; delta?: number }

  if (!sector) {
    return NextResponse.json({ error: 'sector is required.' }, { status: 400 })
  }

  const existing = await prisma.sector.findUnique({ where: { name: sector } })
  if (!existing) {
    return NextResponse.json({ error: `Sector "${sector}" not found.` }, { status: 404 })
  }

  const newIndex = Math.max(0, Math.min(100, existing.complianceIndex + delta))
  const newStatus =
    newIndex >= 80 ? 'pacified' : newIndex <= 20 ? 'lost' : 'contested'

  const updated = await prisma.sector.update({
    where: { name: sector },
    data: { complianceIndex: newIndex, status: newStatus },
  })

  // Emit compliance tick event
  const event = await prisma.event.create({
    data: {
      type: 'COMPLIANCE_TICK',
      payload: JSON.stringify({ sector, newIndex, newStatus }),
    },
  })
  eventBus.publish(event)

  return NextResponse.json(updated)
}
