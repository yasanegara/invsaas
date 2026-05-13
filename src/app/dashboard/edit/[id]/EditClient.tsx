'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Invitation {
  id: string
  title: string
  slug: string
  templateId: string
  status: string
  header: Record<string, any>
  eventInfo: Record<string, any>
  mainText: Record<string, any>
  gallery: Record<string, any>
  rsvp: Record<string, any>
  theme: Record<string, any>
  customHtml: string | null
  publishedUrl: string | null
  viewCount: number
}

export default function EditClient({ invitation }: { invitation: Invitation }) {
  const [title, setTitle] = useState(invitation.title)
  const [header, setHeader] = useState(invitation.header)
  const [eventInfo, setEventInfo] = useState(invitation.eventInfo)
  const [mainText, setMainText] = useState(invitation.mainText)
  const [rsvp, setRsvp] = useState(invitation.rsvp)
  const [theme, setTheme] = useState(invitation.theme)
  const [status, setStatus] = useState(invitation.status)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [regenPrompt, setRegenPrompt] = useState('')
  const [regenLoading, setRegenLoading] = useState(false)
  const [currentHtml, setCurrentHtml] = useState(invitation.customHtml)

  const isWedding = ['elegant-gold', 'modern-clean', 'romantic-pink'].includes(invitation.templateId)

  async function regenerateAi() {
    if (!regenPrompt.trim()) return
    setRegenLoading(true)
    setError('')
    try {
      const genRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: regenPrompt, templateId: invitation.templateId }),
      })
      if (!genRes.ok) throw new Error()
      const data = await genRes.json()

      const saveRes = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title || title, customHtml: data.customHtml }),
      })
      if (!saveRes.ok) throw new Error()

      setCurrentHtml(data.customHtml)
      if (data.title) setTitle(data.title)
      setRegenPrompt('')
    } catch {
      setError('Gagal regenerate, coba lagi.')
    } finally {
      setRegenLoading(false)
    }
  }

  async function save(newStatus?: string) {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const nextStatus = newStatus ?? status
      const res = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          header,
          eventInfo,
          mainText,
          gallery: invitation.gallery,
          rsvp,
          footer: {},
          theme,
          status: nextStatus,
          publishedUrl: nextStatus === 'published' ? `/i/${invitation.slug}` : null,
        }),
      })
      if (!res.ok) throw new Error()
      setStatus(nextStatus)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Gagal menyimpan, coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5' }}>

      {/* Navbar */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Dashboard</Link>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <StatusBadge status={status} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {error && <span style={{ fontSize: 12, color: '#e53e3e' }}>{error}</span>}
          {saved && <span style={{ fontSize: 12, color: '#38a169' }}>✓ Tersimpan</span>}
          {status === 'published' && (
            <a
              href={`/i/${invitation.slug}`}
              target="_blank"
              style={{ fontSize: 13, padding: '7px 14px', borderRadius: 7, border: '1px solid #e0e0e0', textDecoration: 'none', color: '#555' }}
            >
              Lihat Undangan ↗
            </a>
          )}
          {status === 'published' ? (
            <button
              onClick={() => save('draft')}
              disabled={saving}
              style={{ fontSize: 13, padding: '7px 14px', borderRadius: 7, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', color: '#555' }}
            >
              Batalkan Publikasi
            </button>
          ) : (
            <button
              onClick={() => save('published')}
              disabled={saving}
              style={{ fontSize: 13, padding: '7px 14px', borderRadius: 7, border: 'none', background: '#1a6b3a', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
            >
              Publikasikan
            </button>
          )}
          <button
            onClick={() => save()}
            disabled={saving}
            style={{ fontSize: 13, padding: '7px 16px', borderRadius: 7, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* AI Preview Section */}
        {currentHtml && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Undangan AI</span>
              <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontWeight: 500 }}>Groq</span>
            </div>

            {/* Preview iframe - scaled to fit the panel */}
            <div style={{ height: 420, overflow: 'hidden', background: '#f7f7f5', borderBottom: '1px solid #f0f0f0' }}>
              <iframe
                srcDoc={currentHtml}
                style={{ width: '143%', height: '143%', border: 'none', display: 'block', transformOrigin: 'top left', transform: 'scale(0.7)' }}
                sandbox="allow-same-origin allow-popups allow-forms"
              />
            </div>

            {/* Regenerate */}
            <div style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                Generate ulang dengan deskripsi baru:
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={regenPrompt}
                  onChange={e => setRegenPrompt(e.target.value)}
                  placeholder="Ceritakan ulang detail acaramu..."
                  disabled={regenLoading}
                  style={{
                    flex: 1, padding: '9px 13px', borderRadius: 8,
                    border: '1.5px solid #e8e8e8', fontSize: 13,
                    outline: 'none', fontFamily: 'inherit', color: '#1a1a1a',
                  }}
                />
                <button
                  onClick={regenerateAi}
                  disabled={!regenPrompt.trim() || regenLoading}
                  style={{
                    padding: '9px 16px', borderRadius: 8, border: 'none',
                    background: regenPrompt.trim() && !regenLoading ? '#18181b' : '#e4e4e7',
                    color: regenPrompt.trim() && !regenLoading ? '#fff' : '#a1a1aa',
                    fontSize: 13, fontWeight: 500, cursor: regenPrompt.trim() && !regenLoading ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {regenLoading ? 'Generating...' : '✨ Regenerate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Judul */}
        <Section title="Identitas Undangan">
          <Field label="Judul (untuk dashboard)">
            <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Slug URL (tidak bisa diubah)">
            <div style={{ fontSize: 13, padding: '10px 14px', background: '#f7f7f5', borderRadius: 8, color: '#888' }}>
              /i/{invitation.slug}
            </div>
          </Field>
        </Section>

        {/* Header */}
        <Section title="Nama & Sambutan">
          {isWedding ? (
            <>
              <Field label="Nama Mempelai 1">
                <input
                  value={header.names?.[0] ?? ''}
                  onChange={e => setHeader({ ...header, names: [e.target.value, header.names?.[1] ?? ''] })}
                  placeholder="contoh: Arinda"
                  style={inputStyle}
                />
              </Field>
              <Field label="Nama Mempelai 2">
                <input
                  value={header.names?.[1] ?? ''}
                  onChange={e => setHeader({ ...header, names: [header.names?.[0] ?? '', e.target.value] })}
                  placeholder="contoh: Baskara"
                  style={inputStyle}
                />
              </Field>
            </>
          ) : (
            <Field label="Nama">
              <input
                value={header.names?.[0] ?? ''}
                onChange={e => setHeader({ ...header, names: [e.target.value] })}
                placeholder="contoh: Galuh"
                style={inputStyle}
              />
            </Field>
          )}
          <Field label="Tagline">
            <input
              value={header.tagline ?? ''}
              onChange={e => setHeader({ ...header, tagline: e.target.value })}
              placeholder={isWedding ? "We're Getting Married" : 'turns 25!'}
              style={inputStyle}
            />
          </Field>
          <Field label="Hashtag">
            <input
              value={header.hashtag ?? ''}
              onChange={e => setHeader({ ...header, hashtag: e.target.value })}
              placeholder="ArindaBaskara2025"
              style={inputStyle}
            />
          </Field>
        </Section>

        {/* Event Info */}
        <Section title="Informasi Acara">
          <Field label="Tanggal Acara">
            <input
              value={eventInfo.eventDate ?? ''}
              onChange={e => setEventInfo({ ...eventInfo, eventDate: e.target.value })}
              placeholder="Sabtu, 14 Juni 2025"
              style={inputStyle}
            />
          </Field>
          {isWedding && (
            <Field label="Waktu Akad">
              <input
                value={eventInfo.akadTime ?? ''}
                onChange={e => setEventInfo({ ...eventInfo, akadTime: e.target.value })}
                placeholder="08.00 WIB"
                style={inputStyle}
              />
            </Field>
          )}
          <Field label={isWedding ? 'Waktu Resepsi' : 'Waktu Acara'}>
            <input
              value={eventInfo.resepsiTime ?? ''}
              onChange={e => setEventInfo({ ...eventInfo, resepsiTime: e.target.value })}
              placeholder="11.00 – 14.00 WIB"
              style={inputStyle}
            />
          </Field>
          <Field label="Nama Venue">
            <input
              value={eventInfo.venue ?? ''}
              onChange={e => setEventInfo({ ...eventInfo, venue: e.target.value })}
              placeholder="The Sultan Hotel"
              style={inputStyle}
            />
          </Field>
          <Field label="Alamat Venue">
            <input
              value={eventInfo.venueAddress ?? ''}
              onChange={e => setEventInfo({ ...eventInfo, venueAddress: e.target.value })}
              placeholder="Jl. Lingkar Utara No. 1, Yogyakarta"
              style={inputStyle}
            />
          </Field>
          <Field label="Link Google Maps">
            <input
              value={eventInfo.mapsUrl ?? ''}
              onChange={e => setEventInfo({ ...eventInfo, mapsUrl: e.target.value })}
              placeholder="https://maps.google.com/..."
              style={inputStyle}
            />
          </Field>
        </Section>

        {/* Pesan */}
        <Section title="Pesan Undangan">
          <Field label="Pesan Pembuka">
            <textarea
              value={mainText.openingMessage ?? ''}
              onChange={e => setMainText({ ...mainText, openingMessage: e.target.value })}
              placeholder="Dengan penuh rasa syukur dan kebahagiaan, kami mengundang..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </Field>
          <Field label="Quote (opsional)">
            <input
              value={mainText.quote ?? ''}
              onChange={e => setMainText({ ...mainText, quote: e.target.value })}
              placeholder="Cinta bukan soal menatap satu sama lain..."
              style={inputStyle}
            />
          </Field>
        </Section>

        {/* RSVP */}
        <Section title="RSVP Konfirmasi">
          <Field label="Nomor WhatsApp (tanpa +)">
            <input
              value={rsvp.whatsapp ?? ''}
              onChange={e => setRsvp({ ...rsvp, whatsapp: e.target.value })}
              placeholder="628123456789"
              style={inputStyle}
            />
          </Field>
          <Field label="Link Form (opsional, prioritas di atas WA)">
            <input
              value={rsvp.formUrl ?? ''}
              onChange={e => setRsvp({ ...rsvp, formUrl: e.target.value })}
              placeholder="https://forms.google.com/..."
              style={inputStyle}
            />
          </Field>
          <Field label="Batas Konfirmasi (opsional)">
            <input
              value={rsvp.deadline ?? ''}
              onChange={e => setRsvp({ ...rsvp, deadline: e.target.value })}
              placeholder="1 Juni 2025"
              style={inputStyle}
            />
          </Field>
        </Section>

        {/* Statistik */}
        <Section title="Statistik">
          <div style={{ display: 'flex', gap: 16 }}>
            <Stat label="Total Views" value={invitation.viewCount} />
            <Stat label="Status" value={status === 'published' ? 'Dipublikasi' : 'Draft'} />
          </div>
        </Section>

        <div style={{ paddingBottom: 40 }} />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{title}</span>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#666', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ flex: 1, padding: '12px 16px', background: '#f7f7f5', borderRadius: 8 }}>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 500,
      padding: '3px 8px',
      borderRadius: 20,
      background: status === 'published' ? '#dcfce7' : '#f3f4f6',
      color: status === 'published' ? '#166534' : '#6b7280',
    }}>
      {status === 'published' ? 'Published' : 'Draft'}
    </span>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1.5px solid #e8e8e8',
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
  color: '#1a1a1a',
  background: '#fff',
}
