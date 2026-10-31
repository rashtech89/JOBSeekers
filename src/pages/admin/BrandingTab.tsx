import { useState } from 'react'
import { Save } from 'lucide-react'
import { useSiteSettings, type BrandingSettings } from '../../context/SiteSettings'
import { AField, StatusLine, compressImage, useStatus } from './ui'

export default function BrandingTab() {
  const { settings, save } = useSiteSettings()
  const [draft, setDraft] = useState<BrandingSettings>(settings)
  const s = useStatus()
  const set = <K extends keyof BrandingSettings>(k: K, v: BrandingSettings[K]) => setDraft(d => ({ ...d, [k]: v }))
  const pickImage = async (file: File | undefined, key: 'logo' | 'headerCover') => {
    if (!file) return
    try { set(key, await compressImage(file, key === 'logo' ? 512 : 1600, key === 'logo' ? 'image/webp' : 'image/jpeg')); s.clear() } catch (e) { s.fail((e as Error).message) }
  }
  const submit = async () => { s.ok('Saving…'); const r = await save(draft); r.ok ? s.ok('Saved to the cloud. The change is live for all visitors.') : s.fail(r.error || 'Could not save.') }

  return <section className="cv-card">
    <div className="cv-card-title">Branding</div>
    <div className="cv-row">
      <AField label="Site name" value={draft.siteName} onChange={v => set('siteName', v)} />
      <AField label="Tagline" value={draft.tagline} onChange={v => set('tagline', v)} />
    </div>
    <AField label="Footer description" area value={draft.footerDescription} onChange={v => set('footerDescription', v)} />
    <label className="cv-field"><span>Brand colour</span><input type="color" value={draft.primaryColor} onChange={e => set('primaryColor', e.target.value)} /><small>Used only when "Use my brand colour" is ticked in the Themes tab.</small></label>
    <div className="cv-photo-row">
      {draft.logo && <img src={draft.logo} alt="Logo preview" />}
      <label className="button button-outline">Choose logo<input type="file" accept="image/*" hidden onChange={e => { void pickImage(e.target.files?.[0], 'logo'); e.target.value = '' }} /></label>
      {draft.logo && <button className="button button-outline" onClick={() => set('logo', '')}>Remove logo</button>}
    </div>
    <div className="cv-photo-row">
      {draft.headerCover && <img src={draft.headerCover} alt="Cover preview" style={{ width: 160, height: 64, borderRadius: 10 }} />}
      <label className="button button-outline">Choose cover image<input type="file" accept="image/*" hidden onChange={e => { void pickImage(e.target.files?.[0], 'headerCover'); e.target.value = '' }} /></label>
      {draft.headerCover && <button className="button button-outline" onClick={() => set('headerCover', '')}>Remove cover</button>}
    </div>
    <button className="button button-primary" onClick={() => void submit()}><Save size={16}/> Save branding</button>
    <StatusLine status={s.status} />
  </section>
}
