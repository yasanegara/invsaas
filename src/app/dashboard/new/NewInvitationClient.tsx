'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TemplatePicker from '@/components/TemplatePicker'
import type { TemplateId } from '@/templates/types'
import { TEMPLATE_META } from '@/templates/types'

export default function NewInvitationClient() {
  const [step, setStep] = useState<'template' | 'details'>('template')
  const [templateId, setTemplateId] = useState<TemplateId | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function handleTemplateSelect(id: TemplateId) {
    setTemplateId(id)
    setStep('details')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !templateId) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), templateId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/dashboard/edit/${data.id}`)
    } catch {
      setError('Terjadi kesalahan, coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5' }}>
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: 56,
        gap: 16,
      }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>
          ← Kembali
        </Link>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Buat Undangan Baru</span>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <StepDot active={step === 'template'} done={step === 'details'} number={1} label="Pilih template" />
          <div style={{ flex: 1, height: 1, background: step === 'details' ? '#1a1a1a' : '#e0e0e0' }} />
          <StepDot active={step === 'details'} done={false} number={2} label="Detail undangan" />
        </div>

        {step === 'template' ? (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
            <TemplatePicker onSelect={handleTemplateSelect} />
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: '28px 32px' }}>
            {templateId && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: '#f7f7f5',
                borderRadius: 8,
                marginBottom: 28,
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: TEMPLATE_META[templateId].accent,
                  opacity: 0.9,
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{TEMPLATE_META[templateId].label}</div>
                  <button
                    onClick={() => setStep('template')}
                    style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    Ganti template
                  </button>
                </div>
              </div>
            )}

            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>Beri nama undangan</h2>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 24px' }}>
              Nama ini hanya tampil di dashboard kamu
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>
                  Judul Undangan
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="contoh: Pernikahan Arinda & Baskara"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #e0e0e0',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#e53e3e', marginBottom: 16 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={!title.trim() || loading}
                style={{
                  background: '#1a1a1a',
                  color: '#fff',
                  padding: '11px 24px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading || !title.trim() ? 'default' : 'pointer',
                  opacity: !title.trim() ? 0.4 : 1,
                  transition: 'opacity .15s',
                }}
              >
                {loading ? 'Membuat...' : 'Buat Undangan →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function StepDot({ active, done, number, label }: {
  active: boolean
  done: boolean
  number: number
  label: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: done ? '#1a1a1a' : active ? '#1a1a1a' : '#e0e0e0',
        color: done || active ? '#fff' : '#999',
        fontSize: 12,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {done ? '✓' : number}
      </div>
      <span style={{ fontSize: 13, color: active ? '#1a1a1a' : '#999', fontWeight: active ? 500 : 400 }}>
        {label}
      </span>
    </div>
  )
}
