import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/bounties — list bounties, filterable by ?status=
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')

  const bounties = await prisma.bounty.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    include: {
      dossier: {
        select: { callsign: true, threatLevel: true, lastSector: true, status: true },
      },
      claimedBy: {
        select: { callsign: true },
      },
    },
  })

  return NextResponse.json(bounties)
}
