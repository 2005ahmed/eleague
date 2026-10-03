import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gamepad2, User, Mail, Lock } from 'lucide-react'
import { register } from '../services/auth'

function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    nickname: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      await register(form)

      navigate('/')
    } catch (error) {
      const errors = error.response?.data?.errors

      if (errors) {
        const firstError = Object.values(errors)[0]?.[0]
        setError(firstError || 'Registration failed.')
      } else {
        setError(
          error.response?.data?.message ||
          'Registration failed.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08090d] flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

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
            Join the competition.
          </p>

        </div>

        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-7">

          <h2 className="text-2xl font-bold">
            Create account
          </h2>

          <p className="text-gray-500 text-sm mt-1 mb-6">
            Create your player profile.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <div>

              <label className="text-sm text-gray-400">
                Full name
              </label>

              <div className="relative mt-2">

                <User
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-500"
                />

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ahmed El Ibriki"
                  required
                  className="w-full bg-[#11141b] border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500"
                />

              </div>

            </div>

            <div>

              <label className="text-sm text-gray-400">
                Nickname
              </label>

              <input
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
                placeholder="Your gaming nickname"
                required
                className="w-full mt-2 bg-[#11141b] border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500"
              />

            </div>

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
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#11141b] border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500"
                />

              </div>

            </div>

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
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#11141b] border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500"
                />

              </div>

            </div>

            <div>

              <label className="text-sm text-gray-400">
                Confirm password
              </label>

              <input
                type="password"
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full mt-2 bg-[#11141b] border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-xl font-semibold transition mt-2"
            >
              {loading ? 'Creating...' : 'Create account'}
            </button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-6">

            Already have an account?{' '}

            <Link
              to="/login"
              className="text-blue-500 hover:text-blue-400"
            >
              Sign in
            </Link>

          </p>

        </div>

      </div>

    </div>
  )
}

export default Register