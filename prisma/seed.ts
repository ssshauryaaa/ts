import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const sectors = [
  { name: 'Coruscant', complianceIndex: 92, status: 'pacified' },
  { name: 'Outer Rim', complianceIndex: 18, status: 'contested' },
  { name: 'Mid Rim', complianceIndex: 55, status: 'contested' },
  { name: 'Mustafar', complianceIndex: 74, status: 'pacified' },
  { name: 'Mandalore', complianceIndex: 31, status: 'contested' },
  { name: 'Dathomir', complianceIndex: 7, status: 'lost' },
]

const dossierData = [
  {
    callsign: 'GHOST-RUNNER',
    threatLevel: 'critical',
    lastSector: 'Outer Rim',
    associates: 'IRON-VEIL, SHADOW-MARK',
    notes: 'Former Jedi Knight. Proficient in Form III lightsaber combat. Extreme caution advised.',
    status: 'active',
    bountyReward: 50000,
  },
  {
    callsign: 'IRON-VEIL',
    threatLevel: 'high',
    lastSector: 'Dathomir',
    associates: 'GHOST-RUNNER',
    notes: 'Nightsister practitioner. Has evaded capture on three separate occasions.',
    status: 'active',
    bountyReward: 30000,
  },
  {
    callsign: 'SHADOWMERE',
    threatLevel: 'moderate',
    lastSector: 'Mid Rim',
    associates: 'VOID-WATCHER',
    notes: 'Suspected Rebel sympathiser. Pilot of modified YT-1300 freighter.',
    status: 'active',
    bountyReward: 15000,
  },
  {
    callsign: 'VOID-WATCHER',
    threatLevel: 'high',
    lastSector: 'Mandalore',
    associates: 'SHADOWMERE, PULSE-DRIFT',
    notes: 'Intelligence operative. Believed to possess stolen Imperial comm codes.',
    status: 'active',
    bountyReward: 25000,
  },
  {
    callsign: 'PULSE-DRIFT',
    threatLevel: 'low',
    lastSector: 'Coruscant',
    associates: 'VOID-WATCHER',
    notes: 'Small-time slicer. Useful alive for information extraction.',
    status: 'active',
    bountyReward: 8000,
  },
  {
    callsign: 'EMBER-FANG',
    threatLevel: 'critical',
    lastSector: 'Dathomir',
    associates: 'IRON-VEIL',
    notes: 'Possible Force-sensitive. Last confirmed sighting near Dathomir spire ruins.',
    status: 'active',
    bountyReward: 45000,
  },
  {
    callsign: 'STATIC-VEIL',
    threatLevel: 'moderate',
    lastSector: 'Outer Rim',
    associates: null,
    notes: 'Weapons smuggler supplying Rebel cells. Operates under multiple aliases.',
    status: 'active',
    bountyReward: 12000,
  },
  {
    callsign: 'DUSK-CIPHER',
    threatLevel: 'high',
    lastSector: 'Mid Rim',
    associates: 'GHOST-RUNNER, EMBER-FANG',
    notes: 'Former ISB analyst gone rogue. Possesses classified tactical data.',
    status: 'active',
    bountyReward: 35000,
  },
  {
    callsign: 'NIGHT-LANCE',
    threatLevel: 'low',
    lastSector: 'Mustafar',
    associates: 'STATIC-VEIL',
    notes: 'Low-level courier. Follow to higher-value targets.',
    status: 'cleared',
    bountyReward: 5000,
  },
  {
    callsign: 'CRIMSON-NULL',
    threatLevel: 'moderate',
    lastSector: 'Mandalore',
    associates: 'PULSE-DRIFT',
    notes: 'Former Mandalorian warrior. Hired blade for Rebel extraction missions.',
    status: 'active',
    bountyReward: 18000,
  },
]

const agentData = [
  { callsign: 'DIRECTOR-ZERO', rank: 'Director', score: 9800 },
  { callsign: 'AGENT-KIRAL', rank: 'Senior Agent', score: 6200 },
  { callsign: 'AGENT-TORVAN', rank: 'Agent', score: 4100 },
  { callsign: 'AGENT-SELA', rank: 'Agent', score: 2750 },
  { callsign: 'CADET-REX', rank: 'Cadet', score: 800 },
]

async function main() {
  const dbPath = path.resolve(process.cwd(), 'dev.db')
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })

  console.log('🧹 Clearing existing data...')
  await prisma.event.deleteMany()
  await prisma.message.deleteMany()
  await prisma.broadcast.deleteMany()
  await prisma.analysisLog.deleteMany()
  await prisma.bounty.deleteMany()
  await prisma.dossier.deleteMany()
  await prisma.sighting.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.sector.deleteMany()

  console.log('🌌 Seeding sectors...')
  await prisma.sector.createMany({ data: sectors })

  console.log('🕵️ Seeding agents...')
  const agents = []
  for (const a of agentData) {
    const agent = await prisma.agent.create({ data: a })
    agents.push(agent)
  }

  console.log('📁 Seeding dossiers and bounties...')
  for (const d of dossierData) {
    const { bountyReward, ...dossierFields } = d
    const dossier = await prisma.dossier.create({ data: dossierFields })
    // Only create bounty for non-cleared dossiers
    if (dossier.status !== 'cleared') {
      await prisma.bounty.create({
        data: {
          dossierId: dossier.id,
          reward: bountyReward,
          status: 'open',
        },
      })
    }
  }

  console.log('👁️ Seeding sightings...')
  const sightingSectors = ['Outer Rim', 'Dathomir', 'Mid Rim', 'Mandalore', 'Coruscant', 'Mustafar']
  const threatLevels = ['low', 'moderate', 'high', 'critical']
  const sightingDescs = [
    'Suspected Force-wielder detected near abandoned temple.',
    'Unregistered ship docked at hidden landing bay.',
    'Rebel sympathiser meeting observed in cantina.',
    'Encrypted transmissions traced to this sector.',
    'Supply cache discovered — Rebel insignia confirmed.',
    'Unknown Force signature detected by holocron scanners.',
    'Ambush reported — three stormtroopers incapacitated.',
    'Propaganda broadcast originating from sector.',
  ]

  for (let i = 0; i < 8; i++) {
    await prisma.sighting.create({
      data: {
        sector: sightingSectors[i % sightingSectors.length],
        description: sightingDescs[i],
        threatLevel: threatLevels[i % threatLevels.length],
        x: Math.random() * 800 + 100,
        y: Math.random() * 500 + 100,
        reportedBy: agents[i % agents.length].id,
      },
    })
  }

  console.log('📡 Seeding events...')
  await prisma.event.createMany({
    data: [
      {
        type: 'AGENT_JOINED',
        agentId: agents[0].id,
        payload: JSON.stringify({ agentId: agents[0].id, callsign: agents[0].callsign }),
      },
      {
        type: 'AGENT_JOINED',
        agentId: agents[1].id,
        payload: JSON.stringify({ agentId: agents[1].id, callsign: agents[1].callsign }),
      },
      {
        type: 'SIGHTING_REPORTED',
        agentId: agents[2].id,
        payload: JSON.stringify({ sector: 'Outer Rim', threatLevel: 'high' }),
      },
      {
        type: 'DOSSIER_CLEARED',
        agentId: agents[0].id,
        payload: JSON.stringify({ dossierId: 'seed', callsign: 'NIGHT-LANCE' }),
      },
    ],
  })

  console.log('💬 Seeding comms channels...')
  await prisma.message.createMany({
    data: [
      {
        channel: 'general',
        agentId: agents[0].id,
        content: 'All agents — Order 66 compliance sweep initiated. Report all Force-sensitive contacts immediately.',
      },
      {
        channel: 'general',
        agentId: agents[1].id,
        content: 'Confirmed sighting in Outer Rim. Dispatching pursuit unit.',
      },
      {
        channel: 'ops',
        agentId: agents[0].id,
        content: 'Priority target GHOST-RUNNER remains at large. Doubling reward. Use any means necessary.',
      },
    ],
  })

  console.log('✅ Seed complete.')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
