import { initials } from '../lib/social'

export default function Avatar({ name, photo, size = 44 }: { name: string; photo?: string; size?: number }) {
  return photo
    ? <img className="avatar" src={photo} alt="" style={{ width: size, height: size }} />
    : <span className="avatar avatar-text" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">{initials(name)}</span>
}
