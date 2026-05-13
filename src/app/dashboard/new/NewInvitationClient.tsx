'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TemplatePicker from '@/components/TemplatePicker'
import type { TemplateId } from '@/templates/types'
import { TEMPLATE_META } from '@/templates/types'

type Step = 'template' | 'details'

export default function NewInvitationClient() {
  const [step, setStep] = useState<Step>('template')
  const [templateId, setTemplateId] = useState<TemplateId | null>(null)
  const [title, setTitle] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function handleTemplateSelect(id: TemplateId) {
    setTemplateId(id)
    setStep('details')
  }

  async function handleManualSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!title.trim() || !templateId) return
    await createInvitation({ title: title.trim() })
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim() || !templateId) return
    setAiLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, templateId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      await createInvitation({
        title: data.title || title.trim() || aiPrompt.slice(0, 60),
        header: data.header,
        eventInfo: data.eventInfo,
        mainText: data.mainText,
        rsvp: data.rsvp,
      })
    } catch {
      setError('AI gagal generate, coba lagi.')
      setAiLoading(false)
    }
  }

  async function createInvitation(payload: {
    title: string
    header?: object
    eventInfo?: object
    mainText?: object
    rsvp?: object
  }) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, templateId }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/dashboard/edit/${data.id}`)
    } catch {
      setError('Terjadi kesalahan, coba lagi.')
      setLoading(false)
      setAiLoading(false)
    }
  }

  const busy = loading || aiLoading

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
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>

            {/* Template badge */}
            {templateId && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                borderBottom: '1px solid #f0f0f0',
                background: '#fafafa',
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: TEMPLATE_META[templateId].accent,
                }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{TEMPLATE_META[templateId].label}</span>
                  <span style={{ fontSize: 12, color: '#aaa', marginLeft: 8 }}>{TEMPLATE_META[templateId].category}</span>
                </div>
                <button
                  onClick={() => setStep('template')}
                  style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Ganti
                </button>
              </div>
            )}

            {/* AI section */}
            <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>✨</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Isi otomatis dengan AI</span>
                <span style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: '#f0fdf4',
                  color: '#166534',
                  fontWeight: 500,
                }}>Groq</span>
              </div>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 14px' }}>
                Ceritakan detail acaramu, AI akan mengisi semua field secara otomatis
              </p>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder={
                  TEMPLATE_META[templateId!]?.category === 'Pernikahan'
                    ? 'contoh: Pernikahan Arinda Putri dan Baskara Wijaya, Sabtu 14 Juni 2025, akad jam 8 pagi resepsi jam 11 siang, di The Sultan Hotel Yogyakarta, RSVP ke 08123456789'
                    : 'contoh: Ulang tahun Galuh yang ke-25, Sabtu 14 Juni 2025 jam 7 malam, di Rooftop Kemang Jakarta Selatan, dresscode ungu'
                }
                rows={3}
                disabled={busy}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #e8e8e8',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  color: '#1a1a1a',
                  marginBottom: 12,
                }}
              />
              <button
                onClick={handleAiGenerate}
                disabled={!aiPrompt.trim() || busy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: aiPrompt.trim() && !busy ? '#18181b' : '#e4e4e7',
                  color: aiPrompt.trim() && !busy ? '#fff' : '#a1a1aa',
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: aiPrompt.trim() && !busy ? 'pointer' : 'default',
                  transition: 'all .15s',
                }}
              >
                {aiLoading
                  ? <><Spinner /> Generating...</>
                  : <><span>✨</span> Generate dengan AI</>
                }
              </button>
            </div>

            {/* Manual section */}
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 14px' }}>
                Atau isi manual — masukkan judul undangan dulu, edit detail nanti
              </p>
              <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Judul undangan, contoh: Pernikahan Arinda & Baskara"
                  disabled={busy}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #e8e8e8',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                    color: '#1a1a1a',
                  }}
                />
                <button
                  type="submit"
                  disabled={!title.trim() || busy}
                  style={{
                    background: '#fff',
                    color: '#1a1a1a',
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: '1.5px solid #d4d4d8',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: title.trim() && !busy ? 'pointer' : 'default',
                    opacity: !title.trim() ? 0.4 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? 'Membuat...' : 'Isi Manual →'}
                </button>
              </form>
            </div>

            {error && (
              <div style={{ padding: '0 24px 20px' }}>
                <p style={{ fontSize: 13, color: '#e53e3e', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
    </svg>
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
