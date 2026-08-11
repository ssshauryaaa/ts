import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/dossiers — list dossiers with filtering
// ?status=active|cleared  &threat=low|moderate|high|critical  &search=callsign
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const threat = searchParams.get('threat')
  const search = searchParams.get('search')

  const dossiers = await prisma.dossier.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(threat ? { threatLevel: threat } : {}),
      ...(search
        ? { callsign: { contains: search.toUpperCase() } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      bounty: {
        select: { id: true, reward: true, status: true },
      },
    },
  })

  return NextResponse.json(dossiers)
}
