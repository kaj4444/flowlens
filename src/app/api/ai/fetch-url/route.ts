import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    // Fetch the webpage
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Flowlens/1.0)' },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) throw new Error(`Web neodpovídá: ${response.status}`)

    const html = await response.text()

    // Strip HTML tags, keep text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)

    // Summarize with Claude
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Analyzuj tento obsah webové stránky firmy a vytvoř strukturovaný popis firmy pro analýzu procesů.

Obsah webu:
${text}

Napiš popis firmy v češtině (200-400 slov) který zachytí:
- Co firma dělá a jaké produkty/služby nabízí
- Jak funguje jejich byznys model
- Kdo jsou jejich zákazníci
- Jak vypadá typická zakázka nebo obchodní případ
- Jaké procesy jsou pro ně klíčové

Piš jako by to psal konzultant který firmu analyzuje. Žádné nadpisy, jen plynulý text.`
      }]
    })

    const content = (message.content[0] as any).text.trim()
    return NextResponse.json({ content })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
