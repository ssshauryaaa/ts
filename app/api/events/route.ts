import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/events — recent event log (activity feed)
// ?limit=10 (default 10, max 100)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '10', 10))

  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      agent: { select: { callsign: true } },
    },
  })

  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    events.map((e: any) => ({
      ...e,
      payload: (() => {
        try { return JSON.parse(e.payload) } catch { return e.payload }
      })(),
    }))
  )
}
