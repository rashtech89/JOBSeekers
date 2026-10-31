import { useEffect, useMemo, useState } from 'react'
import { Building2, ImagePlus, Palette, Link2, Search, Save, UploadCloud, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useSiteSettings, type BrandingSettings } from '../context/SiteSettings'

const adminSections = [
  { title: 'Brand & Logo', description: 'Logo, site name, tagline and favicon', icon: ImagePlus, keywords: 'logo brand favicon site name tagline' },
  { title: 'Header Cover Photo', description: 'Upload a header/hero background cover image', icon: UploadCloud, keywords: 'header cover photo hero banner background image' },
  { title: 'Colors & Appearance', description: 'Theme colors, visual style and motion', icon: Palette, keywords: 'colors theme appearance style animation' },
  { title: 'Navigation & Pages', description: 'Manage menu links, page visibility and order', icon: Link2, keywords: 'menu navigation pages links home login register' },
  { title: 'Footer & Social Links', description: 'Contact details, social media and app links', icon: Link2, keywords: 'footer social facebook instagram tiktok contact play store app store' },
  { title: 'Jobs & Bulk Upload', description: 'Job posts, poster batches and cleanup', icon: Building2, keywords: 'jobs bulk upload batch expiry delete' },
  { title: 'Languages & SEO', description: 'Languages, RTL, metadata and sitemap settings', icon: Search, keywords: 'language arabic bangla seo sitemap search engine' },
  { title: 'Security & Roles', description: 'Admin permissions, moderation and audit logs', icon: ShieldCheck, keywords: 'security admin permissions roles audit logs' },
]
export default function Admin() {
  const { settings: saved, save: persist } = useSiteSettings()
  const [settings, setSettings] = useState<BrandingSettings>(saved)
  const [search, setSearch] = useState('')
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'; meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => { meta.remove() }
  }, [])
  const [savedMessage, setSavedMessage] = useState('')
  const sections = useMemo(() => adminSections.filter(s => `${s.title} ${s.description} ${s.keywords}`.toLowerCase().includes(search.toLowerCase())), [search])
  function update<K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSavedMessage('')
  }
  function fileToDataUrl(file: File, key: 'logo' | 'headerCover') {
    if (!file.type.startsWith('image/')) { setSavedMessage('Please choose an image file.'); return }
    if (file.size > 8 * 1024 * 1024) { setSavedMessage('Please choose an image under 8 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Images are resized and compressed so the whole settings document stays under Firestore's 1 MiB limit.
        const max = key === 'logo' ? 512 : 1600
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale))
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        let out = ''
        for (const quality of [0.85, 0.7, 0.55, 0.4]) {
          out = canvas.toDataURL(key === 'logo' ? 'image/webp' : 'image/jpeg', quality)
          if (out.length <= 450_000) break
        }
        if (out.length > 450_000) { setSavedMessage('This image is still too large after compression. Please choose a smaller one.'); return }
        update(key, out)
      }
      img.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  }
  async function save() {
    setSavedMessage('Saving…')
    const result = await persist(settings)
    setSavedMessage(result.ok ? 'Saved to the cloud. The change is now live for all visitors.' : (result.error || 'Could not save.'))
  }
  return <div className="content-page admin-page page-enter">
    <div className="admin-title-row"><div className="page-heading"><p className="eyebrow">PRIVATE MANAGEMENT WORKSPACE</p><h1>Admin Control Center</h1><p>Manage the Job Seekers brand, page navigation and site-wide settings from one place.</p></div><button className="button button-primary" onClick={save}><Save size={16}/> Save settings</button></div>
    <label className="admin-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search settings, logo, header, pages, footer..." /></label>
    <div className="admin-layout">
      <section className="admin-settings-main">
        {sections.some(s => ['Brand & Logo','Header Cover Photo','Colors & Appearance'].includes(s.title)) && <div className="admin-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">VISUAL IDENTITY</p><h2>Brand & appearance</h2></div><Palette size={22}/></div>
          {sections.some(s=>s.title==='Brand & Logo') && <div className="settings-grid">
            <label>Website name<input value={settings.siteName} onChange={e=>update('siteName',e.target.value)} placeholder="Job Seekers"/></label>
            <label>Tagline<input value={settings.tagline} onChange={e=>update('tagline',e.target.value)} placeholder="YOUR NEXT OPPORTUNITY"/></label>
            <div className="upload-setting"><strong>Website logo</strong><p>Used in the header, footer and browser branding when configured.</p><label className="file-pick"><ImagePlus size={17}/> Choose logo<input type="file" accept="image/*" onChange={e=>e.target.files?.[0] && fileToDataUrl(e.target.files[0],'logo')}/></label>{settings.logo && <img className="logo-preview" src={settings.logo} alt="Logo preview"/>}</div>
          </div>}
          {sections.some(s=>s.title==='Header Cover Photo') && <div className="upload-setting header-cover-setting"><strong>Header / hero cover photo</strong><p>Choose a wide cover image to personalize the front-page hero area.</p><label className="file-pick"><UploadCloud size={17}/> Upload cover photo<input type="file" accept="image/*" onChange={e=>e.target.files?.[0] && fileToDataUrl(e.target.files[0],'headerCover')}/></label>{settings.headerCover && <img className="cover-preview" src={settings.headerCover} alt="Header cover preview"/>}</div>}
          {sections.some(s=>s.title==='Colors & Appearance') && <div className="settings-grid color-settings"><label>Primary brand color<div className="color-input-row"><input type="color" value={settings.primaryColor} onChange={e=>update('primaryColor',e.target.value)}/><code>{settings.primaryColor}</code></div></label><label>Footer description<input value={settings.footerDescription} onChange={e=>update('footerDescription',e.target.value)} placeholder="Discover opportunities. Build your future."/></label></div>}
        </div>}
        {sections.some(s=>s.title==='Navigation & Pages') && <div className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">SITE STRUCTURE</p><h2>Navigation & pages</h2></div><Link2 size={22}/></div><p className="admin-help">The three-line menu includes searchable links for Home, Find Jobs, Companies, Login, Register, Post a Job, Admin, Contact, Help, Safety, Privacy, Terms and Cookies. The production CMS will allow you to reorder, hide or add pages without editing code.</p><div className="nav-preview-list">{['Home','Find Jobs','Companies','Sign In / Login','Create Account / Register','Post a Job','Contact Us','Help Center','Privacy Policy'].map((name,i)=><div key={name}><span>{String(i+1).padStart(2,'0')}</span>{name}<small>{i<3?'Main navigation':'Menu link'}</small></div>)}</div></div>}
        {sections.some(s=>s.title==='Footer & Social Links') && <div className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">GLOBAL CONTENT</p><h2>Footer & social profiles</h2></div><Link2 size={22}/></div><p className="admin-help">Planned controls for contact email, phone, WhatsApp, Facebook, Instagram, TikTok, YouTube, LinkedIn, Google Play and Apple App Store links. Store badges will remain hidden until valid URLs are supplied.</p></div>}
        {sections.filter(s=>!['Brand & Logo','Header Cover Photo','Colors & Appearance','Navigation & Pages','Footer & Social Links'].includes(s.title)).map(section=><div className="admin-panel compact-admin-panel" key={section.title}><div className="admin-panel-heading"><div><h2>{section.title}</h2><p className="admin-help">{section.description}. This section is planned for the full CMS integration.</p></div><section.icon size={22}/></div></div>)}
        {savedMessage && <p className="admin-save-message"><CheckCircle2 size={17}/>{savedMessage}</p>}
        <button className="button button-primary" onClick={save}><Save size={16}/> Save settings</button>
      </section>
      <aside className="admin-preview"><p className="eyebrow">LIVE PREVIEW</p><h2>{settings.siteName || 'Job Seekers'}</h2>{settings.logo ? <img src={settings.logo} alt="Current logo" className="admin-preview-logo"/> : <span className="admin-preview-mark">JS</span>}<p>{settings.tagline}</p><div className="preview-cover" style={{backgroundImage:settings.headerCover ? `linear-gradient(90deg, #082f2c99, #082f2c20), url("${settings.headerCover}")` : undefined}}><strong>Find work that moves you forward.</strong></div><div className="preview-color" style={{background:settings.primaryColor}}/><small>Preview only · Settings are stored in this browser until backend integration.</small></aside>
    </div>
  </div>
}

