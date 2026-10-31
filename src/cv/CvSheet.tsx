import type { ReactNode } from 'react'
import { languages } from '../i18n/translations'
import { cvLabels } from './cvLabels'
import { skillList, type CvData } from './cvTypes'

const period = (from: string, to: string, current: boolean, present: string) =>
  [from, current ? present : to].filter(Boolean).join(' – ')

/** The A4 page. Printed as-is, so everything inside must stay black-on-white friendly. */
export default function CvSheet({ cv }: { cv: CvData }) {
  const L = cvLabels[cv.cvLang]
  const dir = languages.find(l => l.code === cv.cvLang)?.dir ?? 'ltr'
  const skills = skillList(cv.skills)
  const exp = cv.experience.filter(e => e.company || e.role)
  const edu = cv.education.filter(e => e.school || e.degree)
  const langs = cv.languages.filter(l => l.name)
  const certs = cv.certificates.filter(c => c.name)
  const refs = cv.references.filter(r => r.name)
  const contact = [cv.email, cv.phone, cv.address, cv.links].filter(Boolean)

  const header = <header className="cv-head">
    {cv.photo && <img className="cv-photo" src={cv.photo} alt="" />}
    <div><h1>{cv.fullName || '—'}</h1>{cv.headline && <p className="cv-headline">{cv.headline}</p>}</div>
  </header>

  const experience = exp.length > 0 && <section className="cv-sec"><h2>{L.experience}</h2>
    {exp.map((e, i) => <div className="cv-item" key={i}>
      <div className="cv-item-top"><strong>{e.role}</strong><span className="cv-period">{period(e.from, e.to, e.current, L.present)}</span></div>
      <div className="cv-sub">{[e.company, e.location].filter(Boolean).join(' · ')}</div>
      {e.description && <p>{e.description}</p>}
    </div>)}</section>
  const education = edu.length > 0 && <section className="cv-sec"><h2>{L.education}</h2>
    {edu.map((e, i) => <div className="cv-item" key={i}>
      <div className="cv-item-top"><strong>{e.degree}</strong><span className="cv-period">{period(e.from, e.to, false, '')}</span></div>
      <div className="cv-sub">{e.school}</div></div>)}</section>
  const certificates = certs.length > 0 && <section className="cv-sec"><h2>{L.certificates}</h2>
    <ul>{certs.map((c, i) => <li key={i}>{[c.name, c.issuer, c.year].filter(Boolean).join(' — ')}</li>)}</ul></section>
  const references = refs.length > 0 && <section className="cv-sec"><h2>{L.references}</h2>
    {refs.map((r, i) => <div className="cv-item" key={i}><strong>{r.name}</strong><div className="cv-sub">{[r.role, r.contact].filter(Boolean).join(' · ')}</div></div>)}</section>
  const summary = cv.summary && <section className="cv-sec"><h2>{L.summary}</h2><p>{cv.summary}</p></section>
  const personal = [cv.nationality && `${L.nationality}: ${cv.nationality}`, cv.birthDate && `${L.birth}: ${cv.birthDate}`].filter(Boolean) as string[]

  if (cv.template === 'modern') {
    return <div className="cv-sheet cv-modern" dir={dir} lang={cv.cvLang}>
      <aside className="cv-side">
        {cv.photo && <img className="cv-photo" src={cv.photo} alt="" />}
        {contact.length + personal.length > 0 && <section className="cv-sec"><h2>{L.contact}</h2>{[...contact, ...personal].map((c, i) => <p key={i}>{c}</p>)}</section>}
        {skills.length > 0 && <section className="cv-sec"><h2>{L.skills}</h2><ul>{skills.map(s => <li key={s}>{s}</li>)}</ul></section>}
        {langs.length > 0 && <section className="cv-sec"><h2>{L.languages}</h2>{langs.map((l, i) => <p key={i}>{l.name} — {L[l.level] ?? l.level}</p>)}</section>}
      </aside>
      <div className="cv-main">
        <header className="cv-head"><div><h1>{cv.fullName || '—'}</h1>{cv.headline && <p className="cv-headline">{cv.headline}</p>}</div></header>
        {summary}{experience}{education}{certificates}{references}
      </div>
    </div>
  }

  // Europass-style: label column + content column. (Own design; not the official Europass layout.)
  const row = (label: string, body: ReactNode) => body ? <div className="cv-row"><div className="cv-row-label">{label}</div><div className="cv-row-body">{body}</div></div> : null
  return <div className="cv-sheet cv-europass" dir={dir} lang={cv.cvLang}>
    {header}
    {row(L.contact, contact.length + personal.length > 0 && <>{[...contact, ...personal].map((c, i) => <p key={i}>{c}</p>)}</>)}
    {row(L.summary, cv.summary && <p>{cv.summary}</p>)}
    {row(L.experience, exp.length > 0 && experience && <>{exp.map((e, i) => <div className="cv-item" key={i}>
      <div className="cv-item-top"><strong>{e.role}</strong><span className="cv-period">{period(e.from, e.to, e.current, L.present)}</span></div>
      <div className="cv-sub">{[e.company, e.location].filter(Boolean).join(' · ')}</div>{e.description && <p>{e.description}</p>}</div>)}</>)}
    {row(L.education, edu.length > 0 && <>{edu.map((e, i) => <div className="cv-item" key={i}>
      <div className="cv-item-top"><strong>{e.degree}</strong><span className="cv-period">{period(e.from, e.to, false, '')}</span></div><div className="cv-sub">{e.school}</div></div>)}</>)}
    {row(L.skills, skills.length > 0 && <p>{skills.join(' · ')}</p>)}
    {row(L.languages, langs.length > 0 && <>{langs.map((l, i) => <p key={i}>{l.name} — {L[l.level] ?? l.level}</p>)}</>)}
    {row(L.certificates, certs.length > 0 && <ul>{certs.map((c, i) => <li key={i}>{[c.name, c.issuer, c.year].filter(Boolean).join(' — ')}</li>)}</ul>)}
    {row(L.references, refs.length > 0 && <>{refs.map((r, i) => <div className="cv-item" key={i}><strong>{r.name}</strong><div className="cv-sub">{[r.role, r.contact].filter(Boolean).join(' · ')}</div></div>)}</>)}
  </div>
}
