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
  const [aiTheme, setAiTheme] = useState('')
  const [aiDetails, setAiDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const isWedding = templateId ? TEMPLATE_META[templateId].category === 'Pernikahan' : true

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
    if (!aiDetails.trim() || !templateId) return
    setAiLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: aiTheme.trim(),
          details: aiDetails.trim(),
          templateId,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      await createInvitation({
        title: data.title || title.trim() || aiDetails.slice(0, 60),
        customHtml: data.customHtml,
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
    customHtml?: string
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
  const canGenerate = aiDetails.trim().length > 0 && !busy

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
                <div style={{ width: 28, height: 28, borderRadius: 6, background: TEMPLATE_META[templateId].accent }} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>✨</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Generate halaman undangan dengan AI</span>
                <span style={{
                  fontSize: 11, padding: '2px 7px', borderRadius: 10,
                  background: '#f0fdf4', color: '#166534', fontWeight: 500,
                }}>GPT-4o</span>
              </div>
              <p style={{ fontSize: 12, color: '#999', margin: '0 0 16px' }}>
                AI akan membuat satu halaman undangan digital yang unik — bukan sekedar isi template.
              </p>

              {/* Field 1: Tema visual */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                  Tema & gaya visual
                  <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 4 }}>(opsional)</span>
                </label>
                <textarea
                  value={aiTheme}
                  onChange={e => setAiTheme(e.target.value)}
                  placeholder="contoh: Tema islami dengan motif bunga liar watercolor, warna sage green dan dusty rose, nuansa hangat dan natural..."
                  rows={2}
                  disabled={busy}
                  style={textareaStyle}
                />
              </div>

              {/* Field 2: Detail acara */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                  Detail acara
                  <span style={{ fontWeight: 400, color: '#e53e3e', marginLeft: 4 }}>*</span>
                </label>
                <textarea
                  value={aiDetails}
                  onChange={e => setAiDetails(e.target.value)}
                  placeholder={
                    isWedding
                      ? 'contoh: Pernikahan Arinda Putri dan Baskara Wijaya, Sabtu 14 Juni 2025, akad jam 08.00 resepsi jam 11.00–14.00, di The Sultan Hotel Yogyakarta, RSVP ke 08123456789'
                      : 'contoh: Ulang tahun Galuh ke-25, Sabtu 14 Juni 2025 jam 19.00, di Rooftop Kemang Jakarta Selatan, dresscode ungu'
                  }
                  rows={3}
                  disabled={busy}
                  style={textareaStyle}
                />
                <p style={{ fontSize: 11, color: '#bbb', margin: '4px 0 0' }}>
                  Sertakan: nama, tanggal, waktu, tempat{isWedding ? ', nomor RSVP' : ''}
                </p>
              </div>

              <button
                onClick={handleAiGenerate}
                disabled={!canGenerate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: canGenerate ? '#18181b' : '#e4e4e7',
                  color: canGenerate ? '#fff' : '#a1a1aa',
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: canGenerate ? 'pointer' : 'default',
                  transition: 'all .15s',
                }}
              >
                {aiLoading
                  ? <><Spinner /> Membuat halaman...</>
                  : <><span>✨</span> Generate Undangan</>
                }
              </button>
            </div>

            {/* Manual section */}
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 14px' }}>
                Atau isi manual — masukkan judul dulu, edit detail nanti
              </p>
              <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={isWedding ? 'Judul: Pernikahan Arinda & Baskara' : 'Judul: Ulang Tahun Galuh ke-25'}
                  disabled={busy}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    border: '1.5px solid #e8e8e8', fontSize: 13,
                    outline: 'none', fontFamily: 'inherit', color: '#1a1a1a',
                  }}
                />
                <button
                  type="submit"
                  disabled={!title.trim() || busy}
                  style={{
                    background: '#fff', color: '#1a1a1a', padding: '10px 18px',
                    borderRadius: 8, border: '1.5px solid #d4d4d8', fontSize: 13,
                    fontWeight: 500, cursor: title.trim() && !busy ? 'pointer' : 'default',
                    opacity: !title.trim() ? 0.4 : 1, whiteSpace: 'nowrap',
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

const textareaStyle: React.CSSProperties = {
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
  lineHeight: 1.6,
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
  active: boolean; done: boolean; number: number; label: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: done ? '#1a1a1a' : active ? '#1a1a1a' : '#e0e0e0',
        color: done || active ? '#fff' : '#999',
        fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {done ? '✓' : number}
      </div>
      <span style={{ fontSize: 13, color: active ? '#1a1a1a' : '#999', fontWeight: active ? 500 : 400 }}>
        {label}
      </span>
    </div>
  )
}
