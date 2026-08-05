import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '../firebase'
import { clearLocalCache, loadTrainingProfile } from '../utils/dataSync'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    clearLocalCache()
    setOnboardingComplete(false)
    return signOut(auth)
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  // Called by Onboarding component after saving the plan
  function completeOnboarding() {
    setOnboardingComplete(true)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          const profile = await loadTrainingProfile(user.uid)
          setOnboardingComplete(!!profile?.onboardingComplete)
        } catch {
          setOnboardingComplete(false)
        }
      } else {
        setOnboardingComplete(false)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    onboardingComplete,
    completeOnboarding,
    signup,
    login,
    logout,
    loginWithGoogle,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}