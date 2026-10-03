import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gamepad2, Mail, Lock } from 'lucide-react'
import { login } from '../services/auth'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      await login(email, password)

      navigate('/')
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Email ou mot de passe incorrect.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08090d] flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center">
              <Gamepad2
                size={34}
                className="text-blue-500"
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold">
            e<span className="text-blue-500">League</span>
          </h1>

          <p className="text-gray-500 mt-2">
            Welcome back, champion.
          </p>

        </div>

        {/* Card */}
        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-7">

          <h2 className="text-2xl font-bold">
            Sign in
          </h2>

          <p className="text-gray-500 text-sm mt-1 mb-6">
            Login to your eLeague account.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Email */}
            <div>

              <label className="text-sm text-gray-400">
                Email
              </label>

              <div className="relative mt-2">

                <Mail
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#11141b] border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <label className="text-sm text-gray-400">
                Password
              </label>

              <div className="relative mt-2">

                <Lock
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-500"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#11141b] border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition"
                />

              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-xl font-semibold transition"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-6">

            Don't have an account?{' '}

            <Link
              to="/register"
              className="text-blue-500 hover:text-blue-400"
            >
              Create one
            </Link>

          </p>

        </div>

      </div>

    </div>
  )
}

export default Login