export interface BusEvent {
  id: string
  type: string
  agentId?: string | null
  payload: string // JSON string
  createdAt: Date
}

type Listener = (event: BusEvent) => void

class EventBus {
  private listeners: Set<Listener> = new Set()

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  publish(event: BusEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        // individual listener errors must not crash the bus
      }
    }
  }
}

// Singleton on globalThis so it survives Next.js hot-reload
const globalForBus = globalThis as unknown as { __eventBus: EventBus | undefined }
export const eventBus: EventBus =
  globalForBus.__eventBus ?? (globalForBus.__eventBus = new EventBus())
