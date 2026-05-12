'use client'

import { signIn } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Registrasi berhasil! Silakan masuk.')
    }
  }, [searchParams])

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Email atau password salah')
    } else if (res?.ok) {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f5' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 380, border: '1px solid #eee', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Invitia</h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Masuk ke akun Anda</p>

        {success && <p style={{ color: 'green', fontSize: 13, marginBottom: 16, padding: '8px', background: '#e8f5e9', borderRadius: '4px' }}>{success}</p>}
        {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <form onSubmit={handleCredentialsLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
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
            style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: '#000', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            Masuk
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
          <span style={{ fontSize: 12, color: '#888' }}>ATAU</span>
          <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
        </div>

        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginBottom: 12 }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Masuk dengan Google
        </button>

        <button
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', padding: '12px 16px', border: '1px solid #1f2328', borderRadius: 8, background: '#24292e', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Masuk dengan GitHub
        </button>

        <p style={{ fontSize: 12, color: '#bbb', marginTop: 24, marginBottom: 8 }}>
          Dengan masuk, Anda menyetujui syarat & ketentuan Invitia
        </p>
        <p style={{ fontSize: 14, color: '#666' }}>
          Belum punya akun? <a href="/register" style={{ color: '#000', fontWeight: 600, textDecoration: 'none' }}>Daftar di sini</a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
