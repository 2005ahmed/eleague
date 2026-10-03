import api from './api'

export async function login(email, password) {
  const response = await api.post('/auth/login', {
    email,
    password,
  })

  const { token, user, player } = response.data

  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('player', JSON.stringify(player))

  return response.data
}

export async function register(data) {
  const response = await api.post('/auth/register', data)

  const { token, user, player } = response.data

  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('player', JSON.stringify(player))

  return response.data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('player')
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getUser() {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export function getPlayer() {
  const player = localStorage.getItem('player')
  return player ? JSON.parse(player) : null
}

export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user))
}