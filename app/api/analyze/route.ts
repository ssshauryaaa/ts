import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { analyzeThreat } from '@/lib/claude'

// POST /api/analyze — run AI threat analysis on submitted text
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const agentId = cookieStore.get('agent_id')?.value

  if (!agentId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const body = await request.json()
  const { text } = body as { text?: string }

  if (!text || text.trim().length < 5) {
    return NextResponse.json({ error: 'text must be at least 5 characters.' }, { status: 400 })
  }

  const analysis = await analyzeThreat(text)

  const log = await prisma.analysisLog.create({
    data: {
      agentId,
      inputText: text,
      threatScore: analysis.threatScore,
      summary: analysis.summary,
      flagged: JSON.stringify(analysis.flaggedPhrases),
    },
  })

  return NextResponse.json({
    id: log.id,
    threatScore: analysis.threatScore,
    summary: analysis.summary,
    flaggedPhrases: analysis.flaggedPhrases,
    createdAt: log.createdAt,
  })
}
