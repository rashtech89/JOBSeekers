import { useState } from 'react'
import { ImagePlus, FileText, UploadCloud, ShieldCheck, X } from 'lucide-react'

export default function Upload() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<'image'|'details'>('image')
  const [note, setNote] = useState('')
  function addFiles(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list).filter(f => f.type.startsWith('image/'))
    setFiles(prev => [...prev, ...incoming].slice(0, 500))
  }
  return <div className="content-page narrow-page page-enter">
    <div className="page-heading"><p className="eyebrow">EMPLOYER WORKSPACE</p><h1>Upload a job</h1><p>Post a poster directly or prepare a structured job details page.</p></div>
    <div className="upload-mode"><button className={mode==='image'?'mode-card selected':'mode-card'} onClick={()=>setMode('image')}><ImagePlus size={22}/><strong>Image only</strong><span>Show the original poster</span></button><button className={mode==='details'?'mode-card selected':'mode-card'} onClick={()=>setMode('details')}><FileText size={22}/><strong>Professional details</strong><span>Prepare a structured listing</span></button></div>
    <label className="upload-drop"><input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e=>addFiles(e.target.files)}/><UploadCloud size={35}/><strong>Choose job poster images</strong><span>Drag files here or browse. Prototype limit: 500 selected images.</span><small>JPG, PNG, WebP · Actual upload requires backend configuration.</small></label>
    {files.length>0 && <div className="selected-files"><div className="section-heading"><h2>{files.length} selected</h2><button className="text-link" onClick={()=>setFiles([])}>Clear all</button></div>{files.map((f,i)=><div className="selected-file" key={`${f.name}-${i}`}><ImagePlus size={17}/><span>{f.name}</span><small>{(f.size/1024/1024).toFixed(2)} MB</small><button onClick={()=>setFiles(prev=>prev.filter((_,n)=>n!==i))} aria-label={`Remove ${f.name}`}><X size={15}/></button></div>)}</div>}
    {mode==='details' && <div className="form-card"><h2>Optional job details</h2><label>Job title<input placeholder="e.g. Social Media Executive"/></label><label>Company name<input placeholder="Company name"/></label><label>Country / city<input placeholder="e.g. Kuwait City, Kuwait"/></label><label>Application email or URL<input placeholder="Email or application link"/></label><p className="small-note">In the production version, OCR can suggest values from each poster for review. It will not invent missing information.</p></div>}
    <div className="notice"><ShieldCheck size={18}/><span>Prototype only: files stay in this browser page and are not uploaded or published. Production publishing will require sign-in, validation, and the configured approval workflow.</span></div>
    <button className="button button-primary full-button" onClick={()=>setNote(files.length ? `${files.length} file(s) selected. Backend upload is not connected in this prototype.` : 'Select at least one image to continue.')}>Continue to review</button>
    {note && <p className="inline-notice">{note}</p>}
  </div>
}
