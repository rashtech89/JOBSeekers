import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, reload, sendEmailVerification, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../lib/firebase'

export type AccountType = 'seeker' | 'employer' | 'hr'
type Ctx = {
  user: User | null
  isAdmin: boolean
  loading: boolean
  configured: boolean
  register: (email: string, password: string, name: string, type: AccountType) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<void>
  resendVerification: () => Promise<void>
  refreshUser: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}
const AuthContext = createContext<Ctx | null>(null)
const notConfigured = () => Object.assign(new Error('Firebase is not configured'), { code: 'auth/not-configured' })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(firebaseConfigured)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, async u => {
      setUser(u)
      let admin = false
      if (u && db) {
        try { admin = (await getDoc(doc(db, 'admins', u.uid))).exists() } catch { admin = false }
      }
      setIsAdmin(admin)
      setLoading(false)
    })
  }, [])

  const value = useMemo<Ctx>(() => ({
    user, isAdmin, loading, configured: firebaseConfigured,
    async register(email, password, name, type) {
      if (!auth) throw notConfigured()
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      if (db) {
        try { await setDoc(doc(db, 'users', cred.user.uid), { displayName: name, accountType: type, email, createdAt: serverTimestamp() }) } catch { /* profile doc can be retried later */ }
      }
      try { await sendEmailVerification(cred.user) } catch { /* not critical */ }
    },
    async login(email, password) {
      if (!auth) throw notConfigured()
      await signInWithEmailAndPassword(auth, email, password)
    },
    async logout() { if (auth) await signOut(auth) },
    async loginWithGoogle() {
      if (!auth) throw notConfigured()
      const cred = await signInWithPopup(auth, new GoogleAuthProvider())
      if (db) {
        try {
          const ref = doc(db, 'users', cred.user.uid)
          if (!(await getDoc(ref)).exists()) {
            await setDoc(ref, { displayName: (cred.user.displayName || 'User').slice(0, 80), accountType: 'seeker', email: cred.user.email || '', createdAt: serverTimestamp() })
          }
        } catch { /* profile doc can be created later */ }
      }
    },
    async resendVerification() {
      if (!auth?.currentUser) throw notConfigured()
      await sendEmailVerification(auth.currentUser)
    },
    async refreshUser() {
      if (!auth?.currentUser) return
      await reload(auth.currentUser)
      setUser(auth.currentUser)
      setVersion(v => v + 1)
    },
    async resetPassword(email) {
      if (!auth) throw notConfigured()
      await sendPasswordResetEmail(auth, email)
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, isAdmin, loading, version])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
