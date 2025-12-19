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
import { clearLocalCache } from '../utils/dataSync'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    clearLocalCache()
    return signOut(auth)
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // 👇 THIS WAS THE MISSING PIECE CAUSING THE WHITE SCREEN
  const value = {
    currentUser,
    loading,      // <--- MAKE SURE THIS IS HERE
    signup,
    login,
    logout,
    loginWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}