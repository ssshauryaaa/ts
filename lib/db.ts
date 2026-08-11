import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
  // Strip "file:" prefix for better-sqlite3 which needs a plain filesystem path
  const dbPath = dbUrl.startsWith('file:') ? dbUrl.slice(5) : dbUrl
  const resolvedPath = path.isAbsolute(dbPath)
    ? dbPath
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), dbPath)

  const adapter = new PrismaBetterSqlite3({ url: `file:${resolvedPath}` })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

