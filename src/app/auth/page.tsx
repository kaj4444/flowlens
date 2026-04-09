'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        toast.success('Účet vytvořen! Zkontroluj email pro potvrzení.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message || 'Chyba přihlášení')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 0%, rgba(124,111,247,0.12) 0%, var(--bg) 60%)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent), var(--teal))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px'
            }}>⬡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>Flowlens</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Business process intelligence
          </p>
        </div>

        <div className="glass" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                borderRadius: '6px', fontSize: '14px', fontWeight: 500,
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
              }}>
                {m === 'login' ? 'Přihlásit se' : 'Registrace'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <div>
                <label className="label">Celé jméno</label>
                <input className="input" type="text" placeholder="Jan Novák" value={fullName}
                  onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="jan@firma.cz" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Heslo</label>
              <input className="input" type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ justifyContent: 'center', marginTop: '8px', padding: '12px' }}>
              {loading ? <span className="spinner" /> : (mode === 'login' ? 'Přihlásit se' : 'Vytvořit účet')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
