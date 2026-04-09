import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Vezmi tento popis procesu a strukturuj ho do konkrétních kroků krok za krokem.

Název procesu: ${title}
Popis: ${description}

Odpověz POUZE validním JSON bez markdown backticks:
{
  "steps": [
    {
      "id": "step-1",
      "title": "Název kroku",
      "description": "Co se v kroku děje (1-2 věty)",
      "responsible": "Zodpovědná role",
      "tools": ["nástroj1"],
      "duration": "odhadovaná délka"
    }
  ]
}

Vytvoř 4-8 logicky navazujících kroků. Odpověz v češtině.`
      }]
    })

    const raw = (message.content[0] as any).text.trim()
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
