import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '../context/Auth'
import { useConnections } from '../hooks/useConnections'
import PeopleSuggestions from '../components/PeopleSuggestions'
import Avatar from '../components/Avatar'

export default function Network() {
  const { user, loading } = useAuth()
  const { items, accept, remove, otherUid, otherName, uid } = useConnections()
  if (loading) return <div className="content-page"><p>Loading…</p></div>
  if (!user) return <Navigate to="/login" replace />
  const received = items.filter(c => c.status === 'pending' && c.to === uid)
  const sent = items.filter(c => c.status === 'pending' && c.from === uid)
  const friends = items.filter(c => c.status === 'accepted')
  const row = (c: (typeof items)[number], actions: ReactNode) => <div className="network-row" key={c.id}>
    <Avatar name={otherName(c)} size={44} /><Link to={`/u/${otherUid(c)}`} className="person-name">{otherName(c) || 'Member'}</Link><span className="network-actions">{actions}</span></div>
  return <div className="content-page page-enter"><div className="admin-shell">
    <div className="page-heading"><p className="eyebrow">MY NETWORK</p><h1>My network</h1><p>Connect with job seekers, HR teams and employers.</p></div>
    {received.length > 0 && <section className="cv-card"><div className="cv-card-title">Requests for you ({received.length})</div>
      {received.map(c => row(c, <><button className="button button-primary" onClick={() => void accept(c)}>Accept</button><button className="button button-outline" onClick={() => void remove(c.id)}>Decline</button></>))}</section>}
    <section className="cv-card"><div className="cv-card-title">People you may know</div><PeopleSuggestions max={8} /></section>
    <section className="cv-card"><div className="cv-card-title">Connections ({friends.length})</div>
      {friends.length === 0 && <p className="small-note">No connections yet.</p>}
      {friends.map(c => row(c, <><Link className="button button-outline" to={`/messages?with=${c.id}`}><MessageCircle size={15}/> Message</Link><button className="button button-outline" onClick={() => { if (window.confirm('Remove this connection?')) void remove(c.id) }}>Remove</button></>))}</section>
    {sent.length > 0 && <section className="cv-card"><div className="cv-card-title">Requests you sent</div>{sent.map(c => row(c, <button className="button button-outline" onClick={() => void remove(c.id)}>Cancel</button>))}</section>}
  </div></div>
}
