import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { company, areas } = await req.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `Vygeneruj klíčové procesy pro firmu "${company.name}" pro tyto oblasti: ${areas.map((a: any) => a.name).join(', ')}.

Firma: ${company.description?.slice(0, 500)}
Odvětví: ${company.industry}

Pro každou oblast vygeneruj 2-3 nejdůležitější procesy s kroky.

DŮLEŽITÉ: Odpověz POUZE validním JSON, žádný text před ani po. Formát:
{"processes":[{"area":"přesný název oblasti","title":"Název procesu","steps":[{"id":"step-1","title":"Krok","description":"Popis kroku","responsible":"Role","tools":["nástroj"],"duration":"čas"}]}]}

Každý proces měj 3-5 kroků. Odpověz v češtině.`
      }]
    })

    const raw = (message.content[0] as any).text.trim()
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Find JSON boundaries
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('AI nevrátilo validní JSON')
    
    const jsonStr = cleaned.slice(start, end + 1)
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('Generate processes error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
