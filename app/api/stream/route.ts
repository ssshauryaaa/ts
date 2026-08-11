import { NextResponse } from 'next/server'
import { eventBus, BusEvent } from '@/lib/eventBus'

// Disable Next.js body caching — SSE must not be buffered
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/stream — Server-Sent Events stream for all live updates
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send a heartbeat comment every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 15_000)

      // Subscribe to the event bus
      const unsubscribe = eventBus.subscribe((event: BusEvent) => {
        try {
          const payload = JSON.stringify({
            id: event.id,
            type: event.type,
            agentId: event.agentId,
            payload: (() => {
              try { return JSON.parse(event.payload) } catch { return event.payload }
            })(),
            createdAt: event.createdAt,
          })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        } catch {
          // Client disconnected — ignore
        }
      })

      // Clean up on stream close
      return () => {
        clearInterval(heartbeat)
        unsubscribe()
      }
    },
  })

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  })
}
