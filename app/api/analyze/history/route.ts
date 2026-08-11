import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/analyze/history?agent_id= — past analyses for an agent
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const agentId = searchParams.get('agent_id')

  if (!agentId) {
    return NextResponse.json({ error: 'agent_id query param required.' }, { status: 400 })
  }

  const logs = await prisma.analysisLog.findMany({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      inputText: true,
      threatScore: true,
      summary: true,
      flagged: true,
      createdAt: true,
    },
  })

  return NextResponse.json(
    logs.map((l) => ({
      ...l,
      flaggedPhrases: (() => {
        try { return JSON.parse(l.flagged) } catch { return [] }
      })(),
    }))
  )
}
