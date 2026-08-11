import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { generateBroadcast } from '@/lib/claude'

// POST /api/broadcast — generate AI propaganda broadcast
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const agentId = cookieStore.get('agent_id')?.value

  if (!agentId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const body = await request.json()
  const { prompt } = body as { prompt?: string }

  if (!prompt || prompt.trim().length < 5) {
    return NextResponse.json({ error: 'prompt must be at least 5 characters.' }, { status: 400 })
  }

  const generated = await generateBroadcast(prompt)

  const broadcast = await prisma.broadcast.create({
    data: { agentId, prompt, generated },
  })

  return NextResponse.json(broadcast, { status: 201 })
}

// GET /api/broadcast — paginated gallery of all broadcasts
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10))
  const skip = (page - 1) * limit

  const [broadcasts, total] = await Promise.all([
    prisma.broadcast.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { agent: { select: { callsign: true } } },
    }),
    prisma.broadcast.count(),
  ])

  return NextResponse.json({
    data: broadcasts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
