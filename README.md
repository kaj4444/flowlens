# Flowlens

> Business process intelligence — mapuj, strukturuj a vizualizuj procesy firem s AI.

## Stack

- **Frontend**: Next.js 16 + React + TypeScript
- **Styling**: Custom CSS design system (Syne + DM Sans)
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Mind mapa**: React Flow
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Deployment**: Vercel

---

## Setup — krok za krokem

### 1. Supabase projekt

1. Jdi na [supabase.com](https://supabase.com) → New Project
2. Vyplň název, heslo, region (vybrat EU - Frankfurt)
3. Po vytvoření jdi do **SQL Editor**
4. Vlož celý obsah souboru `supabase-schema.sql` a klikni **Run**
5. Jdi do **Settings → API** a zkopíruj:
   - `Project URL`
   - `anon public` klíč

### 2. Environment variables

Zkopíruj `.env.local.example` jako `.env.local` a vyplň:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Lokální vývoj

```bash
npm install
npm run dev
# Otevři http://localhost:3000
```

### 4. Deployment na Vercel

```bash
# Možnost A: přes Vercel CLI
npm i -g vercel
vercel

# Možnost B: přes GitHub
# 1. Push kód na GitHub
# 2. vercel.com → New Project → Import from GitHub
# 3. Environment Variables přidat stejné jako .env.local
# 4. Deploy
```

---

## Funkce

### Firmy
- Každý uživatel může mít více firem
- Každá firma má vlastní sadu procesů a mind mapu
- Admin účet (nastav `is_admin = true` v Supabase pro svůj účet)

### AI workflow
1. **Přidání firmy** → vyplníš název, odvětví, popis
2. **AI identifikuje** odvětví, segment a navrhne 6-10 procesních oblastí
3. **Potvrdíš oblasti** které chceš zpracovat
4. **AI vygeneruje** procesy krok za krokem pro každou oblast
5. **Mind mapa** se automaticky vygeneruje ze struktury

### Mind mapa
- Drag & drop uzlů
- Přidání vlastních uzlů a poznámek
- Barevné označování + štítky
- Komentáře k uzlům
- Auto-save do Supabase
- Export PNG / PDF
- Share link (read-only verze pro klienty)

### Procesy
- Filtrace podle oblastí
- AI strukturování slovního popisu do kroků
- Přidání vlastních procesů ručně

---

## Admin nastavení

Po registraci prvního účtu (tvůj admin) spusť v Supabase SQL editoru:

```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'tvuj@email.cz';
```

---

## Struktura projektu

```
src/
  app/
    auth/               # Login / registrace
    dashboard/          # Přehled firem
    companies/
      new/              # Přidání firmy + AI flow
      [companyId]/
        page.tsx        # Detail firmy
        processes/      # Seznam procesů
        mindmap/        # Interaktivní mind mapa
    api/ai/
      identify-areas/   # AI identifikace oblastí
      generate-processes/ # AI generování procesů
      structure-process/  # AI strukturování jednoho procesu
    share/[token]/      # Veřejná read-only mapa
  components/
    layout/Sidebar.tsx
    mindmap/
      CustomNode.tsx
      NodePanel.tsx
      MindmapToolbar.tsx
  lib/supabase/         # Client + server klienti
  types/                # TypeScript typy
```
