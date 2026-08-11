import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/leaderboard — ranked agent list by score desc
export async function GET() {
  const agents = await prisma.agent.findMany({
    orderBy: { score: 'desc' },
    select: {
      id: true,
      callsign: true,
      rank: true,
      sector: true,
      score: true,
      _count: {
        select: { claims: true },
      },
    },
  })

  const ranked = agents.map((agent, index) => ({
    rank: index + 1,
    id: agent.id,
    callsign: agent.callsign,
    agentRank: agent.rank,
    sector: agent.sector,
    score: agent.score,
    bountiesClaimed: agent._count.claims,
  }))

  return NextResponse.json(ranked)
}
