import { useCallback, useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { sanitizeProfile, type Profile } from '../lib/social'

/** Loads one profile document. `exists` is false when the person has not created a profile yet (or it is private). */
export function useProfile(uid: string | undefined, fallbackName = '') {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const load = useCallback(async () => {
    if (!db || !uid) { setLoading(false); return }
    setLoading(true); setDenied(false)
    try {
      const snap = await getDoc(doc(db, 'profiles', uid))
      setExists(snap.exists())
      setProfile(snap.exists() ? sanitizeProfile(snap.data(), fallbackName) : null)
    } catch (e) {
      setProfile(null); setExists(false)
      setDenied((e as { code?: string }).code === 'permission-denied')
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])
  useEffect(() => { void load() }, [load])
  return { profile, exists, loading, denied, reload: load, setProfile }
}
