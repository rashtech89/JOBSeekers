import type { ReactNode } from 'react'
import { cvLabels, type CvData } from '../lib/cv'

// Uses divs/spans only (no h1/h2/strong) so the site's dark-theme text colours can never leak into the printed CV.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div className="cv-sec"><div className="cv-sec-title">{title}</div><div className="cv-sec-body">{children}</div></div>
}

export default function CvSheet({ data, accent }: { data: CvData; accent: string }) {
  const L = cvLabels[data.lang]
  const rtl = data.lang === 'ar'
  const skills = data.skills.split(/[\n,;،]+/).map(s => s.trim()).filter(Boolean)
  const contact = [data.email, data.phone, data.address].filter(Boolean)
  const personal = [
    data.nationality && `${L.nationality}: ${data.nationality}`,
    data.birthDate && `${L.birthDate}: ${data.birthDate}`,
  ].filter(Boolean) as string[]
  const range = (from: string, to: string, current = false) => [from, current ? L.present : to].filter(Boolean).join(' – ')

  return <div className={`cv-sheet cv-t-${data.template}`} dir={rtl ? 'rtl' : 'ltr'} lang={data.lang} style={{ ['--cv-accent' as string]: accent }}>
    <div className="cv-head">
      {data.photo && <img className="cv-photo" src={data.photo} alt="" />}
      <div className="cv-head-text">
        <div className="cv-name">{data.fullName || '\u00A0'}</div>
        {data.headline && <div className="cv-headline">{data.headline}</div>}
        {contact.length > 0 && <div className="cv-contact">{contact.map(c => <span key={c}>{c}</span>)}</div>}
        {personal.length > 0 && <div className="cv-contact">{personal.map(c => <span key={c}>{c}</span>)}</div>}
      </div>
    </div>

    {data.summary && <Section title={L.summary}><div className="cv-text">{data.summary}</div></Section>}

    {data.experience.length > 0 && <Section title={L.experience}>
      {data.experience.map(x => <div className="cv-item" key={x.id}>
        <div className="cv-item-head"><span className="cv-item-title">{[x.role, x.company].filter(Boolean).join(' · ')}</span><span className="cv-item-date">{range(x.from, x.to, x.current)}</span></div>
        {x.description && <div className="cv-text">{x.description}</div>}
      </div>)}
    </Section>}

    {data.education.length > 0 && <Section title={L.education}>
      {data.education.map(x => <div className="cv-item" key={x.id}>
        <div className="cv-item-head"><span className="cv-item-title">{[x.degree, x.school].filter(Boolean).join(' · ')}</span><span className="cv-item-date">{range(x.from, x.to)}</span></div>
      </div>)}
    </Section>}

    {skills.length > 0 && <Section title={L.skills}><div className="cv-chips">{skills.map(s => <span key={s}>{s}</span>)}</div></Section>}

    {data.languages.length > 0 && <Section title={L.languages}>
      {data.languages.map(x => <div className="cv-item cv-lang" key={x.id}><span className="cv-item-title">{x.name}</span><span className="cv-item-date">{x.level}</span></div>)}
    </Section>}

    {data.certificates && <Section title={L.certificates}><div className="cv-text">{data.certificates}</div></Section>}
    {data.references && <Section title={L.references}><div className="cv-text">{data.references}</div></Section>}
  </div>
}
