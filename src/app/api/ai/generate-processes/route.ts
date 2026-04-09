import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { company, areas } = await req.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Vygeneruj klíčové procesy pro firmu "${company.name}" pro každou z těchto oblastí: ${areas.map((a: any) => a.name).join(', ')}.

Firma: ${company.description}
Odvětví: ${company.industry}

Pro každou oblast vygeneruj 2-4 nejdůležitější procesy s kroky krok za krokem.

Odpověz POUZE validním JSON bez markdown backticks:
{
  "processes": [
    {
      "area": "přesný název oblasti jak bylo zadáno",
      "title": "Název procesu",
      "steps": [
        {
          "id": "step-1",
          "title": "Název kroku",
          "description": "Co se v tomto kroku děje (1-2 věty)",
          "responsible": "Kdo je zodpovědný (role)",
          "tools": ["nástroj1", "nástroj2"],
          "duration": "odhadovaná délka"
        }
      ]
    }
  ]
}

Každý proces měj 4-8 kroků. Procesy musí být praktické a relevantní pro tento typ firmy. Odpověz v češtině.`
      }]
    })

    const raw = (message.content[0] as any).text.trim()
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
