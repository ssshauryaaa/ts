import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/compliance — returns galaxy-wide compliance index + per-sector breakdown
export async function GET() {
  const sectors = await prisma.sector.findMany({
    orderBy: { name: 'asc' },
  })

  const totalDossiers = await prisma.dossier.count()
  const clearedDossiers = await prisma.dossier.count({ where: { status: 'cleared' } })

  const pacifiedSectors = sectors.filter((s) => s.status === 'pacified').length
  const totalSectors = sectors.length

  // Weighted formula: 50% from dossier clears, 50% from sector pacification
  const dossierFactor = totalDossiers > 0 ? (clearedDossiers / totalDossiers) * 50 : 0
  const sectorFactor = totalSectors > 0 ? (pacifiedSectors / totalSectors) * 50 : 0
  const galaxyIndex = Math.round(dossierFactor + sectorFactor)

  return NextResponse.json({
    galaxyIndex,
    sectors: sectors.map((s) => ({
      id: s.id,
      name: s.name,
      complianceIndex: s.complianceIndex,
      status: s.status,
    })),
    stats: {
      totalDossiers,
      clearedDossiers,
      pacifiedSectors,
      totalSectors,
    },
  })
}
