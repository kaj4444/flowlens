'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface SidebarProps {
  companies: { id: string; name: string }[]
  currentCompanyId?: string
}

export default function Sidebar({ companies, currentCompanyId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Odhlášeno')
    router.push('/auth')
  }

  return (
    <div className="sidebar">
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent), var(--teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⬡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>Flowlens</span>
        </Link>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <NavItem href="/dashboard" label="Dashboard" icon="▦" active={pathname === '/dashboard'} />
        <NavItem href="/companies" label="Firmy" icon="◈" active={pathname === '/companies'} />

        {companies.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '8px' }}>
              Moje firmy
            </div>
            {companies.map(c => (
              <CompanyNavItem key={c.id} company={c} isActive={currentCompanyId === c.id} currentPath={pathname} />
            ))}
          </div>
        )}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '13px' }}>
          <span>⎋</span> Odhlásit se
        </button>
      </div>
    </div>
  )
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
      borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
      color: active ? 'var(--text)' : 'var(--text-muted)',
      background: active ? 'var(--surface)' : 'transparent',
      borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      transition: 'all 0.15s', marginBottom: '2px'
    }}>
      <span style={{ fontSize: '14px', opacity: 0.8 }}>{icon}</span>
      {label}
    </Link>
  )
}

function CompanyNavItem({ company, isActive, currentPath }: { company: { id: string; name: string }; isActive: boolean; currentPath: string }) {
  const basePath = `/companies/${company.id}`
  return (
    <div style={{ marginBottom: '2px' }}>
      <Link href={basePath} style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px',
        borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '13px',
        color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
        background: isActive ? 'var(--accent-dim)' : 'transparent', transition: 'all 0.15s'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? 'var(--accent)' : 'var(--text-dim)', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company.name}</span>
      </Link>
      {isActive && (
        <div style={{ marginLeft: '26px', marginTop: '2px' }}>
          <SubNavItem href={`${basePath}/processes`} label="Procesy" active={currentPath.includes('/processes')} />
          <SubNavItem href={`${basePath}/mindmap`} label="Mind mapa" active={currentPath.includes('/mindmap')} />
        </div>
      )}
    </div>
  )
}

function SubNavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} style={{
      display: 'block', padding: '5px 10px', fontSize: '12px', textDecoration: 'none',
      color: active ? 'var(--accent-light)' : 'var(--text-dim)',
      borderRadius: '6px', background: active ? 'rgba(91,79,212,0.08)' : 'transparent',
      transition: 'all 0.15s', marginBottom: '1px'
    }}>
      {label}
    </Link>
  )
}
