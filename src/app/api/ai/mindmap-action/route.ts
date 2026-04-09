import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentNodes, companyName } = await req.json()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Jsi AI asistent pro mind mapu firmy "${companyName}". Aktuální uzly: ${currentNodes.map((n: any) => `${n.label} (${n.type})`).join(', ')}. Uživatel říká: "${prompt}". Odpověz POUZE validním JSON bez markdown backticks. Pokud přidáváš jeden uzel: {"action":"add_node","label":"název","nodeType":"default","color":"#hex","content":"popis","tag":null,"connectTo":"název existujícího uzlu nebo null"}. Pokud přidáváš více uzlů: {"action":"add_multiple","nodes":[{"label":"název","nodeType":"default","color":"#hex","content":"popis","tag":null,"connectTo":"název rodiče nebo null"}]}. Pokud není jasné: {"action":"message","message":"upřesnění"}. Odpověz v češtině.`
      }]
    })
    const raw = (message.content[0] as any).text.trim()
    const cleaned = raw.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim()
    return NextResponse.json(JSON.parse(cleaned))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
