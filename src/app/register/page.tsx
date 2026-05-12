'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Gagal mendaftar')
      } else {
        window.location.href = '/login?registered=true'
      }
    } catch (err) {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f5' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 380, border: '1px solid #eee', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Daftar Invitia</h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Buat akun baru Anda</p>

        {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: loading ? '#ccc' : '#000', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <p style={{ fontSize: 14, color: '#666' }}>
          Sudah punya akun? <Link href="/login" style={{ color: '#000', fontWeight: 600, textDecoration: 'none' }}>Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
