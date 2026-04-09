import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const AREA_COLORS: Record<string, string> = {
  'Obchod': '#7c6ff7', 'Prodej': '#7c6ff7',
  'Marketing': '#f59e0b', 'Reklama': '#f59e0b',
  'Výroba': '#10b981', 'Provoz': '#10b981',
  'Logistika': '#3b82f6', 'Doprava': '#3b82f6', 'Sklad': '#3b82f6',
  'Finance': '#6366f1', 'Účetnictví': '#6366f1',
  'HR': '#ec4899', 'Lidé': '#ec4899',
  'IT': '#14b8a6', 'Technologie': '#14b8a6',
  'Zákaznický servis': '#f97316', 'Podpora': '#f97316',
  'Nákup': '#8b5cf6', 'Zásobování': '#8b5cf6',
  'Kvalita': '#22c55e',
}

function getColor(name: string): string {
  for (const [key, color] of Object.entries(AREA_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return color
  }
  const colors = ['#7c6ff7','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#f97316']
  return colors[Math.floor(Math.random() * colors.length)]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, industry, size, description } = body

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Analyzuj tuto firmu a navrhni klíčové firemní oblasti (oddělení/funkce) které je potřeba procesně zmapovat.

Firma: ${name}
Odvětví: ${industry || 'neuvedeno'}
Velikost: ${size || 'neuvedena'}
Popis: ${description}

Odpověz POUZE validním JSON bez markdown backticks v tomto formátu:
{
  "summary": "Krátký 1-2 větový popis firmy a jejího byznysu",
  "business_type": "typ firmy (výrobní/obchodní/servisní/konzultační...)",
  "areas": [
    {
      "name": "Název oblasti (max 2 slova)",
      "description": "Co se v této oblasti děje (max 15 slov)",
      "icon": "jedna emoji která oblast reprezentuje"
    }
  ]
}

Navrhni 6-10 oblastí které jsou pro tento typ firmy standardní a relevantní. Oblasti musí pokrýt celý cyklus zakázky od poptávky po platbu. Odpověz v češtině.`
      }]
    })

    const raw = (message.content[0] as any).text.trim()
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const areas = parsed.areas.map((a: any) => ({
      ...a,
      color: getColor(a.name)
    }))

    return NextResponse.json({ areas, summary: parsed.summary, business_type: parsed.business_type })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
