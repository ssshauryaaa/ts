import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ThreatAnalysis {
  threatScore: number // 0-100
  summary: string
  flaggedPhrases: string[]
}

export async function analyzeThreat(text: string): Promise<ThreatAnalysis> {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an Imperial Security Bureau AI threat-analysis system. Analyze the following intercepted transmission and return ONLY a valid JSON object (no markdown, no preamble) with these fields:
- "threatScore": integer 0-100 (0 = no threat, 100 = maximum threat)
- "summary": 2-3 sentence ISB-style assessment
- "flaggedPhrases": array of strings — phrases from the text that triggered concern

Transmission:
"""
${text}
"""

Respond with only the JSON object.`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'

  try {
    const parsed = JSON.parse(raw) as ThreatAnalysis
    return {
      threatScore: Math.max(0, Math.min(100, Number(parsed.threatScore) || 0)),
      summary: String(parsed.summary || ''),
      flaggedPhrases: Array.isArray(parsed.flaggedPhrases) ? parsed.flaggedPhrases : [],
    }
  } catch {
    return { threatScore: 0, summary: raw.slice(0, 500), flaggedPhrases: [] }
  }
}

export async function generateBroadcast(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an Imperial propaganda broadcast writer for the Imperial Security Bureau. Generate a formal counter-recruitment broadcast based on the following directive. Write it as an authentic-sounding Imperial holo-transmission — use official Imperial terminology, dramatic phrasing, and galactic-scale authority. Keep it to 3-5 paragraphs.

Directive: ${prompt}`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
