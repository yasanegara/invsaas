'use client'

import { useState, useRef } from 'react'
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

const SECTIONS = [
  { id: 'identitas', label: 'Identitas',       icon: '📋', scrollTarget: null as string[] | null },
  { id: 'nama',      label: 'Nama & Sambutan', icon: '💍', scrollTarget: ['section-hero', 'cover'] },
  { id: 'acara',     label: 'Informasi Acara', icon: '📅', scrollTarget: ['section-akad', 'section-detail', 'section-resepsi'] },
  { id: 'pesan',     label: 'Pesan',           icon: '💌', scrollTarget: ['section-pesan'] },
  { id: 'rsvp',      label: 'RSVP',            icon: '📱', scrollTarget: ['section-rsvp'] },
  { id: 'statistik', label: 'Statistik',       icon: '📊', scrollTarget: ['section-footer'] },
  { id: 'ai',        label: 'Generate Ulang',  icon: '✨', scrollTarget: null },
]

function injectScrollListener(html: string): string {
  const skipCover = `<style>#cover{display:none!important}#content{display:block!important;opacity:1!important}</style>`
  const listener = `<script>window.addEventListener('message',function(e){if(!e.data||e.data.type!=='scrollTo')return;var ids=e.data.ids||[];for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});break;}}});</` + `script>`
  let result = html.includes('<head>') ? html.replace('<head>', '<head>' + skipCover) : skipCover + html
  result = result.includes('</body>') ? result.replace('</body>', listener + '</body>') : result + listener
  return result
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
  const [regenTheme, setRegenTheme] = useState('')
  const [regenDetails, setRegenDetails] = useState('')
  const [regenLoading, setRegenLoading] = useState(false)
  const [currentHtml, setCurrentHtml] = useState(invitation.customHtml)
  const [activeSection, setActiveSection] = useState('identitas')

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isWedding = ['elegant-gold', 'modern-clean', 'romantic-pink', 'paper-quilling-islami'].includes(invitation.templateId)

  function scrollPreviewTo(ids: string[]) {
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'scrollTo', ids }, '*')
    } catch {}
  }

  function handleSectionClick(sectionId: string) {
    setActiveSection(sectionId)
    const sec = SECTIONS.find(s => s.id === sectionId)
    if (sec?.scrollTarget) {
      setTimeout(() => scrollPreviewTo(sec.scrollTarget!), 60)
    }
  }

  function handleIframeLoad() {
    const sec = SECTIONS.find(s => s.id === activeSection)
    if (sec?.scrollTarget) {
      setTimeout(() => scrollPreviewTo(sec.scrollTarget!), 100)
    }
  }

  async function regenerateAi() {
    if (!regenDetails.trim()) return
    setRegenLoading(true)
    setError('')
    try {
      const genRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: regenTheme.trim(),
          details: regenDetails.trim(),
          templateId: invitation.templateId,
        }),
      })
      if (!genRes.ok) throw new Error()
      const data = await genRes.json()

      const saveRes = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title || title, customHtml: data.customHtml }),
      })
      const saveData = await saveRes.json().catch(() => ({}))
      if (!saveRes.ok) throw new Error(saveData.error || `HTTP ${saveRes.status}`)

      setCurrentHtml(data.customHtml)
      if (data.title) setTitle(data.title)
      setRegenTheme('')
      setRegenDetails('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal regenerate, coba lagi.')
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
      const resData = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(resData.error || `HTTP ${res.status}`)
      setStatus(nextStatus)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan, coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f7f5', overflow: 'hidden' }}>

      {/* Navbar */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              Lihat ↗
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

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: section editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Section tabs — sticky */}
          <div style={{
            padding: '12px 20px',
            background: '#fff',
            borderBottom: '1px solid #eee',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            flexShrink: 0,
          }}>
            {SECTIONS.map(sec => (
              <button
                key={sec.id}
                onClick={() => handleSectionClick(sec.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 20,
                  border: activeSection === sec.id ? '2px solid #1a1a1a' : '1.5px solid #e0e0e0',
                  background: activeSection === sec.id ? '#1a1a1a' : '#fff',
                  color: activeSection === sec.id ? '#fff' : '#555',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                <span>{sec.icon}</span>
                <span>{sec.label}</span>
              </button>
            ))}
          </div>

          {/* Section content — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Identitas */}
              {activeSection === 'identitas' && (
                <SectionCard title="Identitas Undangan">
                  <Field label="Judul (untuk dashboard)">
                    <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Slug URL (tidak bisa diubah)">
                    <div style={{ fontSize: 13, padding: '10px 14px', background: '#f7f7f5', borderRadius: 8, color: '#888' }}>
                      /i/{invitation.slug}
                    </div>
                  </Field>
                </SectionCard>
              )}

              {/* Nama & Sambutan */}
              {activeSection === 'nama' && (
                <SectionCard title="Nama & Sambutan">
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
                </SectionCard>
              )}

              {/* Informasi Acara */}
              {activeSection === 'acara' && (
                <SectionCard title="Informasi Acara">
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
                </SectionCard>
              )}

              {/* Pesan */}
              {activeSection === 'pesan' && (
                <SectionCard title="Pesan Undangan">
                  <Field label="Pesan Pembuka">
                    <textarea
                      value={mainText.openingMessage ?? ''}
                      onChange={e => setMainText({ ...mainText, openingMessage: e.target.value })}
                      placeholder="Dengan penuh rasa syukur dan kebahagiaan, kami mengundang..."
                      rows={5}
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
                </SectionCard>
              )}

              {/* RSVP */}
              {activeSection === 'rsvp' && (
                <SectionCard title="RSVP Konfirmasi">
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
                </SectionCard>
              )}

              {/* Statistik */}
              {activeSection === 'statistik' && (
                <SectionCard title="Statistik">
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Stat label="Total Views" value={invitation.viewCount} />
                    <Stat label="Status" value={status === 'published' ? 'Dipublikasi' : 'Draft'} />
                  </div>
                </SectionCard>
              )}

              {/* Generate Ulang */}
              {activeSection === 'ai' && (
                <SectionCard title="Generate Ulang dengan AI" badge="GPT-4o">
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px' }}>
                    Buat ulang halaman undangan AI dengan prompt baru.
                  </p>
                  <Field label="Tema visual (opsional)">
                    <input
                      value={regenTheme}
                      onChange={e => setRegenTheme(e.target.value)}
                      placeholder="contoh: islami paper quilling, emerald green dan gold..."
                      disabled={regenLoading}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Detail acara *">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={regenDetails}
                        onChange={e => setRegenDetails(e.target.value)}
                        placeholder={isWedding ? 'Nama, tanggal, venue, RSVP...' : 'Nama, tanggal, tempat...'}
                        disabled={regenLoading}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={regenerateAi}
                        disabled={!regenDetails.trim() || regenLoading}
                        style={{
                          padding: '10px 16px', borderRadius: 8, border: 'none',
                          background: regenDetails.trim() && !regenLoading ? '#18181b' : '#e4e4e7',
                          color: regenDetails.trim() && !regenLoading ? '#fff' : '#a1a1aa',
                          fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                          cursor: regenDetails.trim() && !regenLoading ? 'pointer' : 'default',
                        }}
                      >
                        {regenLoading ? 'Generating...' : '✨ Generate'}
                      </button>
                    </div>
                  </Field>
                </SectionCard>
              )}

            </div>
          </div>
        </div>

        {/* Right: phone preview */}
        {currentHtml && (
          <div style={{
            width: 360,
            flexShrink: 0,
            borderLeft: '1px solid #ddd',
            background: '#e8e8e6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 20px',
            overflow: 'hidden',
          }}>
            <p style={{ fontSize: 11, color: '#999', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>
              Preview
            </p>

            {/* Phone frame */}
            <div style={{
              width: 260, height: 520,
              border: '10px solid #1a1a1a', borderRadius: 36,
              overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
              background: '#fff', flexShrink: 0, display: 'flex', flexDirection: 'column',
            }}>
              {/* Notch */}
              <div style={{ height: 20, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 48, height: 5, borderRadius: 3, background: '#333' }} />
              </div>
              {/* iframe */}
              <div style={{ width: 240, height: 480, overflow: 'hidden', flexShrink: 0 }}>
                <iframe
                  ref={iframeRef}
                  srcDoc={injectScrollListener(currentHtml)}
                  onLoad={handleIframeLoad}
                  style={{
                    width: 390, height: 780,
                    border: 'none', display: 'block',
                    transform: 'scale(0.6154)',
                    transformOrigin: 'top left',
                  }}
                  sandbox="allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>

            <p style={{ fontSize: 11, color: '#bbb', marginTop: 16, textAlign: 'center', lineHeight: 1.6 }}>
              Klik section untuk scroll<br />ke bagian tersebut
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{title}</span>
        {badge && (
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontWeight: 500 }}>{badge}</span>
        )}
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
      fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
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
