import { useState } from 'react'
import { Save } from 'lucide-react'
import { useContent } from '../../context/Content'
import { themes } from '../../lib/themes'
import { StatusLine, useStatus } from './ui'

export default function ThemeTab() {
  const { theme, save } = useContent()
  const [themeId, setThemeId] = useState(theme.themeId)
  const [brandOverride, setBrandOverride] = useState(theme.brandOverride)
  const s = useStatus()
  const submit = async () => { s.ok('Saving…'); const r = await save('theme', { themeId, brandOverride }); r.ok ? s.ok('Theme saved. It is now live for all visitors.') : s.fail(r.error || 'Could not save.') }
  return <section className="cv-card">
    <div className="cv-card-title">Whole-site themes</div>
    <p className="small-note">A theme changes the colours, card style, corner shape and font of the whole website. You can switch any time.</p>
    <div className="admin-grid">
      {themes.map(th => <button key={th.id} className={themeId === th.id ? 'theme-card active' : 'theme-card'} onClick={() => setThemeId(th.id)}>
        <span className="theme-swatch">{th.swatch.map(c => <i key={c} style={{ background: c }} />)}</span>
        <strong>{th.name}</strong><small>{th.description}</small>
      </button>)}
    </div>
    <label className="admin-checks"><span><input type="checkbox" checked={brandOverride} onChange={e => setBrandOverride(e.target.checked)} /> Use my brand colour (from the Branding tab) instead of the theme's main colour</span></label>
    <button className="button button-primary" onClick={() => void submit()}><Save size={16}/> Save theme</button>
    <StatusLine status={s.status} />
  </section>
}
