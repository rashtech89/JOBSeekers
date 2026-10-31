import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { isExternal, safeHref } from '../lib/siteContent'

/** Internal paths use the router; https / mailto / tel links open normally. Unsafe values render as plain text. */
export default function SmartLink({ to, children, nav = false, onClick, className }: { to: string; children: ReactNode; nav?: boolean; onClick?: () => void; className?: string }) {
  const href = safeHref(to)
  if (!href) return <span className={className}>{children}</span>
  if (isExternal(href)) return <a className={className} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer noopener" onClick={onClick}>{children}</a>
  return nav ? <NavLink className={className} to={href} onClick={onClick}>{children}</NavLink> : <Link className={className} to={href} onClick={onClick}>{children}</Link>
}
