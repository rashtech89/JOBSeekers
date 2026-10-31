import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Download, FilePlus2, Plus, Trash2 } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { useSiteSettings } from '../context/SiteSettings'
import { languages, type Lang } from '../i18n/translations'
import CvSheet from '../components/CvSheet'
import { cvLabels, loadCvs, newSaved, saveCvs, uid, type CvData, type SavedCv } from '../lib/cv'

function Field({ label, value, onChange, type = 'text', area = false, hint }: { label: string; value: string; onChange: (v: string) => void; type?: string; area?: boolean; hint?: string }) {
  return <label className="cv-field"><span>{label}</span>
    {area ? <textarea rows={4} value={value} onChange={e => onChange(e.target.value)} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} />}
    {hint && <small>{hint}</small>}
  </label>
}
const Card = ({ title, children }: { title: string; children: ReactNode }) => <section className="cv-card"><div className="cv-card-title">{title}</div>{children}</section>
const patchItem = <T extends { id: string }>(list: T[], id: string, p: Partial<NoInfer<T>>): T[] => list.map(x => x.id === id ? { ...x, ...p } : x)

/** Scales the 794px-wide A4 sheet down to fit the screen (phones). Printing ignores this and uses the real A4 page. */
function PreviewFrame({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(1123)
  useEffect(() => {
    const measure = () => {
      if (outer.current) setScale(Math.min(1, outer.current.clientWidth / 794))
      if (inner.current) setHeight(inner.current.offsetHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (outer.current) ro.observe(outer.current)
    if (inner.current) ro.observe(inner.current)
    return () => ro.disconnect()
  }, [])
  return <div ref={outer} className="cv-frame" style={{ height: height * scale }}>
    <div ref={inner} style={{ width: 794, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
  </div>
}

export default function CvBuilder() {
  const { lang } = useLang()
  const { settings } = useSiteSettings()
  const T = cvLabels[lang]
  const [cvs, setCvs] = useState<SavedCv[]>(() => { const l = loadCvs(); return l.length ? l : [newSaved(lang)] })
  const [activeId, setActiveId] = useState<string>(() => cvs[0].id)
  const [saveFailed, setSaveFailed] = useState(false)
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const active = cvs.find(c => c.id === activeId) ?? cvs[0]
  const d = active.data

  useEffect(() => { setSaveFailed(!saveCvs(cvs)) }, [cvs])

  const update = (patch: Partial<CvData>) =>
    setCvs(list => list.map(c => c.id === active.id ? { ...c, updatedAt: new Date().toISOString(), data: { ...c.data, ...patch } } : c))
  const addCv = (copyFrom?: SavedCv) => {
    const fresh = copyFrom ? { ...copyFrom, id: uid(), updatedAt: new Date().toISOString(), data: structuredClone(copyFrom.data) } : newSaved(lang)
    setCvs(list => [fresh, ...list]); setActiveId(fresh.id)
  }
  const deleteCv = () => {
    const rest = cvs.filter(c => c.id !== active.id)
    const next = rest.length ? rest : [newSaved(lang)]
    setCvs(next); setActiveId(next[0].id)
  }
  const onPhoto = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const s = Math.min(1, 360 / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
        c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
        update({ photo: c.toDataURL('image/jpeg', 0.82) })
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }
  const download = async () => {
    const previous = document.title
    document.title = `CV - ${d.fullName || 'Job Seekers'}`
    try { await document.fonts?.ready } catch { /* ignore */ }
    const restore = () => { document.title = previous; window.removeEventListener('afterprint', restore) }
    window.addEventListener('afterprint', restore)
    window.print()
  }

  const printRoot = document.getElementById('print-root')
  const label = (c: SavedCv) => c.data.fullName || T.untitled

  return <div className="content-page page-enter cv-page">
    <div className="page-heading"><p className="eyebrow">CV</p><h1>{T.title}</h1><p>{T.sub}</p></div>

    <div className="cv-toolbar">
      <select aria-label={T.myCvs} value={active.id} onChange={e => setActiveId(e.target.value)}>{cvs.map(c => <option key={c.id} value={c.id}>{label(c)}</option>)}</select>
      <button className="button button-outline" onClick={() => addCv()}><FilePlus2 size={16}/> {T.newCv}</button>
      <button className="button button-outline" onClick={() => addCv(active)}><Copy size={16}/> {T.duplicate}</button>
      <button className="button button-outline" onClick={deleteCv}><Trash2 size={16}/> {T.deleteCv}</button>
      <button className="button button-primary" onClick={download}><Download size={16}/> {T.download}</button>
    </div>
    <p className="small-note">{T.downloadHint} {T.privacyNote}</p>
    {saveFailed && <p className="notice">{T.saveError}</p>}

    <div className="cv-mobile-tabs">
      <button className={mobileView === 'edit' ? 'active' : ''} onClick={() => setMobileView('edit')}>{T.edit}</button>
      <button className={mobileView === 'preview' ? 'active' : ''} onClick={() => setMobileView('preview')}>{T.preview}</button>
    </div>

    <div className={`cv-grid view-${mobileView}`}>
      <div className="cv-form">
        <Card title={T.template}>
          <div className="cv-row">
            <label className="cv-field"><span>{T.cvLanguage}</span>
              <select value={d.lang} onChange={e => update({ lang: e.target.value as Lang })}>{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>
            <label className="cv-field"><span>{T.template}</span>
              <select value={d.template} onChange={e => update({ template: e.target.value as CvData['template'] })}><option value="modern">{T.modern}</option><option value="europass">{T.europass}</option></select></label>
          </div>
        </Card>

        <Card title={T.personal}>
          <Field label={T.fullName} value={d.fullName} onChange={v => update({ fullName: v })} />
          <Field label={T.headline} value={d.headline} onChange={v => update({ headline: v })} />
          <div className="cv-row">
            <Field label={T.email} type="email" value={d.email} onChange={v => update({ email: v })} />
            <Field label={T.phone} type="tel" value={d.phone} onChange={v => update({ phone: v })} />
          </div>
          <Field label={T.address} value={d.address} onChange={v => update({ address: v })} />
          <div className="cv-row">
            <Field label={T.nationality} value={d.nationality} onChange={v => update({ nationality: v })} />
            <Field label={T.birthDate} value={d.birthDate} onChange={v => update({ birthDate: v })} />
          </div>
          <div className="cv-photo-row">
            {d.photo && <img src={d.photo} alt="" />}
            <label className="button button-outline">{T.choosePhoto}<input type="file" accept="image/*" hidden onChange={e => { onPhoto(e.target.files?.[0]); e.target.value = '' }} /></label>
            {d.photo && <button className="button button-outline" onClick={() => update({ photo: '' })}>{T.removePhoto}</button>}
          </div>
        </Card>

        <Card title={T.summary}><Field label={T.summary} area value={d.summary} onChange={v => update({ summary: v })} /></Card>

        <Card title={T.experience}>
          {d.experience.map(x => <div className="cv-subcard" key={x.id}>
            <div className="cv-row"><Field label={T.role} value={x.role} onChange={v => update({ experience: patchItem(d.experience, x.id, { role: v }) })} />
              <Field label={T.company} value={x.company} onChange={v => update({ experience: patchItem(d.experience, x.id, { company: v }) })} /></div>
            <div className="cv-row"><Field label={T.from} value={x.from} onChange={v => update({ experience: patchItem(d.experience, x.id, { from: v }) })} />
              <Field label={T.to} value={x.to} onChange={v => update({ experience: patchItem(d.experience, x.id, { to: v }) })} /></div>
            <label className="cv-check"><input type="checkbox" checked={x.current} onChange={e => update({ experience: patchItem(d.experience, x.id, { current: e.target.checked }) })} /> {T.present}</label>
            <Field label={T.description} area value={x.description} onChange={v => update({ experience: patchItem(d.experience, x.id, { description: v }) })} />
            <button className="button button-outline" onClick={() => update({ experience: d.experience.filter(e => e.id !== x.id) })}><Trash2 size={15}/> {T.remove}</button>
          </div>)}
          <button className="button button-outline" onClick={() => update({ experience: [...d.experience, { id: uid(), company: '', role: '', from: '', to: '', current: false, description: '' }] })}><Plus size={15}/> {T.add}</button>
        </Card>

        <Card title={T.education}>
          {d.education.map(x => <div className="cv-subcard" key={x.id}>
            <div className="cv-row"><Field label={T.degree} value={x.degree} onChange={v => update({ education: patchItem(d.education, x.id, { degree: v }) })} />
              <Field label={T.school} value={x.school} onChange={v => update({ education: patchItem(d.education, x.id, { school: v }) })} /></div>
            <div className="cv-row"><Field label={T.from} value={x.from} onChange={v => update({ education: patchItem(d.education, x.id, { from: v }) })} />
              <Field label={T.to} value={x.to} onChange={v => update({ education: patchItem(d.education, x.id, { to: v }) })} /></div>
            <button className="button button-outline" onClick={() => update({ education: d.education.filter(e => e.id !== x.id) })}><Trash2 size={15}/> {T.remove}</button>
          </div>)}
          <button className="button button-outline" onClick={() => update({ education: [...d.education, { id: uid(), school: '', degree: '', from: '', to: '' }] })}><Plus size={15}/> {T.add}</button>
        </Card>

        <Card title={T.skills}><Field label={T.skills} area hint={T.skillsHint} value={d.skills} onChange={v => update({ skills: v })} /></Card>

        <Card title={T.languages}>
          {d.languages.map(x => <div className="cv-subcard" key={x.id}>
            <div className="cv-row"><Field label={T.langName} value={x.name} onChange={v => update({ languages: patchItem(d.languages, x.id, { name: v }) })} />
              <Field label={T.level} value={x.level} onChange={v => update({ languages: patchItem(d.languages, x.id, { level: v }) })} /></div>
            <button className="button button-outline" onClick={() => update({ languages: d.languages.filter(e => e.id !== x.id) })}><Trash2 size={15}/> {T.remove}</button>
          </div>)}
          <button className="button button-outline" onClick={() => update({ languages: [...d.languages, { id: uid(), name: '', level: '' }] })}><Plus size={15}/> {T.add}</button>
        </Card>

        <Card title={T.certificates}><Field label={T.certificates} area value={d.certificates} onChange={v => update({ certificates: v })} /></Card>
        <Card title={T.references}><Field label={T.references} area value={d.references} onChange={v => update({ references: v })} /></Card>
      </div>

      <div className="cv-preview"><PreviewFrame><CvSheet data={d} accent={settings.primaryColor} /></PreviewFrame></div>
    </div>

    {printRoot && createPortal(<CvSheet data={d} accent={settings.primaryColor} />, printRoot)}
  </div>
}
