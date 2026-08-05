import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Failed to log in: ' + err.message)
    }
    setLoading(false)
  }

  async function handleGoogleSignIn() {
    try {
      setError('')
      setLoading(true)
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      setError('Failed to log in with Google: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-50"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
            <h1 className="text-4xl font-black text-white mb-2 text-center">FitTrack</h1>
            <p className="text-gray-400 text-center mb-8">Sign in to continue</p>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="text-gray-400 text-sm">OR</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>🔐</span> Sign in with Google
            </button>

            <p className="text-center text-gray-400 mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}