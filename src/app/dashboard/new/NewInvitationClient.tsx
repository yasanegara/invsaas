'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TemplatePicker from '@/components/TemplatePicker'
import type { TemplateId } from '@/templates/types'
import { TEMPLATE_META } from '@/templates/types'

type Step = 'template' | 'details' | 'preview'

const COLOR_PALETTES = [
  { id: 'gold-cream',  label: 'Emas & Krem',  colors: ['#c9a94e', '#f5e6c8', '#6b4c0f'] },
  { id: 'emerald',     label: 'Emerald',       colors: ['#065f46', '#a7f3d0', '#064e3b'] },
  { id: 'navy-gold',   label: 'Navy & Gold',   colors: ['#1e3a5f', '#c9a94e', '#0f172a'] },
  { id: 'maroon',      label: 'Maroon',        colors: ['#7f1d1d', '#fca5a5', '#450a0a'] },
  { id: 'lavender',    label: 'Lavender',      colors: ['#4c1d95', '#ddd6fe', '#2e1065'] },
  { id: 'rose-gold',   label: 'Rose Gold',     colors: ['#9d174d', '#fbcfe8', '#500724'] },
] as const

const BG_STYLES = [
  { id: 'gradient', label: '🌈 Gradient berlapis' },
  { id: 'geometric', label: '◆ Geometri' },
  { id: 'floral', label: '🌸 Floral / Batik' },
  { id: 'solid', label: '▪ Solid elegan' },
] as const

const ANIM_LEVELS = [
  { id: 'subtle', label: '✦ Halus' },
  { id: 'medium', label: '✦✦ Sedang' },
  { id: 'rich',   label: '✦✦✦ Meriah' },
] as const

const VISUAL_STYLES = [
  { id: 'none',          label: 'Default' },
  { id: 'glassmorphism', label: '🪟 Glassmorphism' },
  { id: 'paper-quilling',label: '🌀 Paper Quilling' },
  { id: 'neumorphism',   label: '⬜ Neumorphism' },
  { id: 'royal-islamic', label: '☪️ Royal Islamic' },
  { id: 'earth-tones',   label: '🍂 Earth Tones' },
  { id: 'cyberpunk',     label: '⚡ Cyberpunk Neon' },
] as const

const TYPOGRAPHY_PAIRS = [
  { id: 'script-sans',   label: 'Script + Sans',   fonts: 'Great Vibes + Raleway' },
  { id: 'serif-sans',    label: 'Serif + Sans',     fonts: 'Cormorant Garamond + Montserrat' },
  { id: 'display-serif', label: 'Display + Serif',  fonts: 'Cinzel + Playfair Display' },
  { id: 'arabic-serif',  label: 'Arabic + Serif',   fonts: 'Amiri + Playfair Display' },
  { id: 'playful',       label: 'Playful',          fonts: 'Pacifico + Nunito' },
] as const

const ORNAMENT_STYLES = [
  { id: 'floral-svg',  label: '🌺 Bunga & Daun' },
  { id: 'geometric-svg', label: '◆ Geometri Islam' },
  { id: 'minimal-line', label: '— Garis Minimal' },
  { id: 'mandala',     label: '✿ Mandala' },
  { id: 'ribbon',      label: '🎀 Ribbon & Pita' },
] as const

interface InvField { key: string; label: string; multiline?: boolean }
interface InvSection { id: string; label: string; icon: string; fields: InvField[] }

const FIELD_LABELS: Record<string, { label: string; multiline?: boolean }> = {
  'cover-names':      { label: 'Nama di cover' },
  'cover-date':       { label: 'Tanggal di cover' },
  'cover-button':     { label: 'Teks tombol buka' },
  'hero-names':       { label: 'Nama mempelai / ulang tahun' },
  'hero-tagline':     { label: 'Tagline' },
  'opening-message':  { label: 'Pesan pembuka', multiline: true },
  'quote':            { label: 'Quote / Ayat', multiline: true },
  'akad-time':        { label: 'Waktu akad' },
  'akad-venue':       { label: 'Venue akad' },
  'akad-address':     { label: 'Alamat akad', multiline: true },
  'resepsi-time':     { label: 'Waktu resepsi' },
  'resepsi-venue':    { label: 'Venue resepsi' },
  'resepsi-address':  { label: 'Alamat resepsi', multiline: true },
  'event-time':       { label: 'Waktu acara' },
  'event-venue':      { label: 'Nama tempat' },
  'event-address':    { label: 'Alamat', multiline: true },
  'dresscode':        { label: 'Dresscode' },
  'rsvp-button':      { label: 'Teks tombol RSVP' },
  'hashtag':          { label: 'Hashtag' },
  'footer-names':     { label: 'Nama di footer' },
}

const SECTION_DEFS = [
  { id: 'cover',            label: 'Cover / Pembuka', icon: '🎴' },
  { id: 'section-cover',    label: 'Cover / Pembuka', icon: '🎴' },
  { id: 'section-hero',     label: 'Hero & Nama',     icon: '💍' },
  { id: 'section-pesan',    label: 'Pesan',           icon: '💌' },
  { id: 'section-akad',     label: 'Detail Akad',     icon: '🕌' },
  { id: 'section-resepsi',  label: 'Detail Resepsi',  icon: '🎊' },
  { id: 'section-detail',   label: 'Detail Acara',    icon: '📅' },
  { id: 'section-rsvp',     label: 'RSVP',            icon: '📱' },
  { id: 'section-footer',   label: 'Footer',          icon: '🏷️' },
]

function extractSections(html: string): { sections: InvSection[]; values: Record<string, string> } {
  if (typeof window === 'undefined') return { sections: [], values: {} }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const sections: InvSection[] = []
  const values: Record<string, string> = {}
  const seenLabels = new Set<string>()
  const seenKeys = new Set<string>()

  for (const def of SECTION_DEFS) {
    const el = doc.getElementById(def.id)
    if (!el || seenLabels.has(def.label)) continue
    seenLabels.add(def.label)

    const fields: InvField[] = []
    el.querySelectorAll('[data-edit]').forEach(editEl => {
      const key = editEl.getAttribute('data-edit')!
      if (!key || seenKeys.has(key)) return
      seenKeys.add(key)
      const meta = FIELD_LABELS[key] ?? { label: key }
      fields.push({ key, label: meta.label, multiline: meta.multiline })
      values[key] = editEl.textContent?.trim() ?? ''
    })

    if (fields.length > 0) sections.push({ ...def, fields })
  }

  // Fallback: AI tidak selalu mengikuti section ID — scan seluruh dokumen
  if (sections.length === 0) {
    const allEditEls = doc.querySelectorAll('[data-edit]')
    if (allEditEls.length > 0) {
      // Kelompokkan per ancestor section/div ber-ID
      const groupMap = new Map<string, { def: { id: string; label: string; icon: string }; fields: InvField[] }>()
      allEditEls.forEach(editEl => {
        const key = editEl.getAttribute('data-edit')!
        if (!key || seenKeys.has(key)) return
        seenKeys.add(key)

        // Cari ancestor dengan ID
        let ancestor: Element | null = editEl.parentElement
        let groupId = 'misc'
        let groupLabel = 'Konten'
        let groupIcon = '📝'
        while (ancestor && ancestor !== doc.body) {
          if (ancestor.id) {
            groupId = ancestor.id
            const sectionDef = SECTION_DEFS.find(d => d.id === ancestor!.id)
            if (sectionDef) { groupLabel = sectionDef.label; groupIcon = sectionDef.icon }
            break
          }
          ancestor = ancestor.parentElement
        }

        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, { def: { id: groupId, label: groupLabel, icon: groupIcon }, fields: [] })
        }
        const meta = FIELD_LABELS[key] ?? { label: key }
        groupMap.get(groupId)!.fields.push({ key, label: meta.label, multiline: meta.multiline })
        values[key] = editEl.textContent?.trim() ?? ''
      })

      for (const { def, fields } of groupMap.values()) {
        if (fields.length > 0) sections.push({ ...def, fields })
      }
    }
  }

  return { sections, values }
}

function applyEdit(html: string, key: string, value: string): string {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll(`[data-edit="${key}"]`).forEach(el => { el.textContent = value })
  return '<!DOCTYPE html>' + doc.documentElement.outerHTML
}

function makePreviewSrc(html: string): string {
  // Inject CSS to show content directly (skip cover animation for preview)
  const style = `<style>#cover{display:none!important}#content{display:block!important;opacity:1!important}</style>`
  return html.includes('<head>') ? html.replace('<head>', '<head>' + style) : style + html
}

export default function NewInvitationClient() {
  const [step, setStep] = useState<Step>('template')
  const [templateId, setTemplateId] = useState<TemplateId | null>(null)
  const [aiTheme, setAiTheme] = useState('')
  const [aiDetails, setAiDetails] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  // Style pickers
  const [colorPalette, setColorPalette] = useState<string>('gold-cream')
  const [bgStyle, setBgStyle] = useState<string>('gradient')
  const [animLevel, setAnimLevel] = useState<string>('medium')
  const [visualStyle, setVisualStyle] = useState<string>('none')
  const [typoPair, setTypoPair] = useState<string>('script-sans')
  const [ornamentStyle, setOrnamentStyle] = useState<string>('floral-svg')
  const [musicUrl, setMusicUrl] = useState<string>('')
  const [socialMedia, setSocialMedia] = useState<string>('')

  // Referensi gambar
  const [refImage, setRefImage] = useState<string | null>(null)
  const [refImageName, setRefImageName] = useState('')

  // Preview/edit step
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [sections, setSections] = useState<InvSection[]>([])
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [generatedTitle, setGeneratedTitle] = useState('')

  const router = useRouter()
  const isWedding = templateId ? TEMPLATE_META[templateId].eventType === 'wedding' : true
  const busy = loading || aiLoading
  const canGenerate = aiDetails.trim().length > 0 && !busy

  function handleTemplateSelect(id: TemplateId) {
    setTemplateId(id)
    setStep('details')
  }

  async function handleManualSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!title.trim() || !templateId) return
    await createInvitation({ title: title.trim() })
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setError('Gambar terlalu besar, maksimal 4MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      setRefImage(ev.target?.result as string)
      setRefImageName(file.name)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  async function handleAiGenerate() {
    if (!aiDetails.trim() || !templateId) return
    setAiLoading(true)
    setError('')
    try {
      const palette = COLOR_PALETTES.find(p => p.id === colorPalette)
      const bgLabel = BG_STYLES.find(b => b.id === bgStyle)?.label ?? ''
      const animLabel = ANIM_LEVELS.find(a => a.id === animLevel)?.label ?? ''
      const visualLabel = VISUAL_STYLES.find(v => v.id === visualStyle)?.label ?? ''
      const typo = TYPOGRAPHY_PAIRS.find(t => t.id === typoPair)
      const ornamentLabel = ORNAMENT_STYLES.find(o => o.id === ornamentStyle)?.label ?? ''
      const stylePrompt = [
        palette ? `Palet warna: ${palette.label} (${palette.colors.join(', ')})` : '',
        `Background: ${bgLabel}`,
        `Animasi: ${animLabel}`,
        visualStyle !== 'none' ? `Gaya visual: ${visualLabel}` : '',
        typo ? `Tipografi: ${typo.fonts}` : '',
        `Ornamen: ${ornamentLabel}`,
        musicUrl.trim() ? `Musik latar: ${musicUrl.trim()} — embed audio dengan floating play/pause button` : '',
        socialMedia.trim() ? `Tagar/medsos: ${socialMedia.trim()}` : '',
        aiTheme.trim(),
      ].filter(Boolean).join('. ')

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: stylePrompt, details: aiDetails.trim(), templateId, refImage }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (!data.customHtml) throw new Error()

      const { sections: detected, values } = extractSections(data.customHtml)
      setGeneratedHtml(data.customHtml)
      setSections(detected)
      setEditValues(values)
      setActiveSection(detected[0]?.id ?? null)
      setGeneratedTitle(data.title || aiDetails.slice(0, 60))
      setStep('preview')
    } catch {
      setError('AI gagal generate, coba lagi.')
    } finally {
      setAiLoading(false)
    }
  }

  function updateField(key: string, value: string) {
    setEditValues(prev => ({ ...prev, [key]: value }))
    setGeneratedHtml(prev => prev ? applyEdit(prev, key, value) : prev)
  }

  async function createInvitation(payload: {
    title: string; header?: object; eventInfo?: object; mainText?: object; rsvp?: object; customHtml?: string
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
      const inv = await res.json()
      router.push(`/dashboard/edit/${inv.id}`)
    } catch {
      setError('Terjadi kesalahan, coba lagi.')
      setLoading(false)
    }
  }

  // ── STEP 3: Preview + Edit ───────────────────────────────────────────────
  if (step === 'preview' && generatedHtml) {
    const activeSec = sections.find(s => s.id === activeSection)

    return (
      <div style={{ minHeight: '100vh', background: '#f7f7f5' }}>
        {/* Sticky navbar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #eee', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 56, position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setStep('details')}
              style={{ fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              ← Generate ulang
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{generatedTitle}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {error && <span style={{ fontSize: 12, color: '#e53e3e' }}>{error}</span>}
            <button
              onClick={() => createInvitation({ title: generatedTitle, customHtml: generatedHtml! })}
              disabled={loading}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#1a6b3a', color: '#fff', fontSize: 13, fontWeight: 500,
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Menyimpan...' : 'Simpan & Lanjut →'}
            </button>
          </div>
        </div>

        {/* Body: editor kiri + preview kanan */}
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

          {/* Section editor */}
          <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: 560 }}>

            {sections.length === 0 ? (
              <div style={{
                background: '#fff', borderRadius: 12, border: '1px solid #eee',
                padding: 32, textAlign: 'center',
              }}>
                <p style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
                  Tidak ada section yang terdeteksi untuk diedit.
                </p>
                <p style={{ fontSize: 12, color: '#bbb' }}>
                  Hasil tetap tersimpan dan bisa dilihat di preview. Generate ulang jika ingin mengedit per section.
                </p>
              </div>
            ) : (
              <>
                {/* Section tabs */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {sections.map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 20,
                        border: activeSection === sec.id ? '2px solid #1a1a1a' : '1.5px solid #e0e0e0',
                        background: activeSection === sec.id ? '#1a1a1a' : '#fff',
                        color: activeSection === sec.id ? '#fff' : '#555',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      <span>{sec.icon}</span>
                      <span>{sec.label}</span>
                    </button>
                  ))}
                </div>

                {/* Active section fields */}
                {activeSec && (
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
                    <div style={{
                      padding: '14px 20px', borderBottom: '1px solid #f0f0f0',
                      background: '#fafafa', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 18 }}>{activeSec.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{activeSec.label}</span>
                      <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>
                        {activeSec.fields.length} field
                      </span>
                    </div>
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {activeSec.fields.map(field => (
                        <div key={field.key}>
                          <label style={{ fontSize: 12, fontWeight: 500, color: '#666', display: 'block', marginBottom: 6 }}>
                            {field.label}
                          </label>
                          {field.multiline ? (
                            <textarea
                              value={editValues[field.key] ?? ''}
                              onChange={e => updateField(field.key, e.target.value)}
                              rows={3}
                              style={inputStyle}
                            />
                          ) : (
                            <input
                              type="text"
                              value={editValues[field.key] ?? ''}
                              onChange={e => updateField(field.key, e.target.value)}
                              style={inputStyle}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Phone preview — kanan */}
          <div style={{
            width: 360, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '28px 24px',
            background: '#e8e8e6', borderLeft: '1px solid #ddd',
            position: 'sticky', top: 56, height: 'calc(100vh - 56px)',
          }}>
            <p style={{ fontSize: 11, color: '#999', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' }}>
              Preview
            </p>
            {/* Phone frame — proporsional untuk layar undangan */}
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
              {/* Wrapper: clip ke ukuran phone, iframe di-scale dari 390px */}
              <div style={{ width: 240, height: 480, overflow: 'hidden', flexShrink: 0 }}>
                <iframe
                  srcDoc={makePreviewSrc(generatedHtml)}
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
            <p style={{ fontSize: 11, color: '#bbb', marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
              Edit di kiri,<br />preview update otomatis
            </p>
          </div>

        </div>
      </div>
    )
  }

  // ── STEP 1 & 2: Template + Generate ─────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5' }}>
      <div style={{
        background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px',
        display: 'flex', alignItems: 'center', height: 56, gap: 16,
      }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>
          ← Kembali
        </Link>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Buat Undangan Baru</span>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <StepDot active={step === 'template'} done={step !== 'template'} number={1} label="Pilih template" />
          <div style={{ flex: 1, height: 1, background: step !== 'template' ? '#1a1a1a' : '#e0e0e0' }} />
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
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa',
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
                }}>Claude Sonnet</span>
              </div>
              <p style={{ fontSize: 12, color: '#999', margin: '0 0 16px' }}>
                AI membuat satu halaman undangan digital yang unik. Setelah generate, kamu bisa edit per section.
              </p>

              {/* Palet warna */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>Palet warna</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {COLOR_PALETTES.map(p => (
                    <button key={p.id} onClick={() => setColorPalette(p.id)} disabled={busy} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                      borderRadius: 20, border: colorPalette === p.id ? '2px solid #1a1a1a' : '1.5px solid #e0e0e0',
                      background: colorPalette === p.id ? '#f5f5f5' : '#fff',
                      cursor: busy ? 'default' : 'pointer', fontSize: 12, fontWeight: 500,
                    }}>
                      <span style={{ display: 'flex', gap: 2 }}>
                        {p.colors.map((c, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />)}
                      </span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background style */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>Background</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {BG_STYLES.map(b => (
                    <button key={b.id} onClick={() => setBgStyle(b.id)} disabled={busy} style={{
                      padding: '6px 12px', borderRadius: 20,
                      border: bgStyle === b.id ? '2px solid #1a1a1a' : '1.5px solid #e0e0e0',
                      background: bgStyle === b.id ? '#1a1a1a' : '#fff',
                      color: bgStyle === b.id ? '#fff' : '#555',
                      cursor: busy ? 'default' : 'pointer', fontSize: 12, fontWeight: 500,
                    }}>{b.label}</button>
                  ))}
                </div>
              </div>

              {/* Animasi */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>Animasi</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ANIM_LEVELS.map(a => (
                    <button key={a.id} onClick={() => setAnimLevel(a.id)} disabled={busy} style={{
                      padding: '6px 14px', borderRadius: 20,
                      border: animLevel === a.id ? '2px solid #1a1a1a' : '1.5px solid #e0e0e0',
                      background: animLevel === a.id ? '#1a1a1a' : '#fff',
                      color: animLevel === a.id ? '#fff' : '#555',
                      cursor: busy ? 'default' : 'pointer', fontSize: 12, fontWeight: 500,
                    }}>{a.label}</button>
                  ))}
                </div>
              </div>

              {/* Gaya visual */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>Gaya visual</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {VISUAL_STYLES.map(v => (
                    <button key={v.id} onClick={() => setVisualStyle(v.id)} disabled={busy} style={{
                      padding: '6px 12px', borderRadius: 20,
                      border: visualStyle === v.id ? '2px solid #1a1a1a' : '1.5px solid #e0e0e0',
                      background: visualStyle === v.id ? '#1a1a1a' : '#fff',
                      color: visualStyle === v.id ? '#fff' : '#555',
                      cursor: busy ? 'default' : 'pointer', fontSize: 12, fontWeight: 500,
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>

              {/* Tipografi */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>Tipografi</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TYPOGRAPHY_PAIRS.map(t => (
                    <button key={t.id} onClick={() => setTypoPair(t.id)} disabled={busy} style={{
                      padding: '6px 12px', borderRadius: 20,
                      border: typoPair === t.id ? '2px solid #1a1a1a' : '1.5px solid #e0e0e0',
                      background: typoPair === t.id ? '#1a1a1a' : '#fff',
                      color: typoPair === t.id ? '#fff' : '#555',
                      cursor: busy ? 'default' : 'pointer', fontSize: 12, fontWeight: 500,
                    }}>
                      <span>{t.label}</span>
                      <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>{t.fonts}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ornamen */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>Ornamen</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ORNAMENT_STYLES.map(o => (
                    <button key={o.id} onClick={() => setOrnamentStyle(o.id)} disabled={busy} style={{
                      padding: '6px 12px', borderRadius: 20,
                      border: ornamentStyle === o.id ? '2px solid #1a1a1a' : '1.5px solid #e0e0e0',
                      background: ornamentStyle === o.id ? '#1a1a1a' : '#fff',
                      color: ornamentStyle === o.id ? '#fff' : '#555',
                      cursor: busy ? 'default' : 'pointer', fontSize: 12, fontWeight: 500,
                    }}>{o.label}</button>
                  ))}
                </div>
              </div>

              {/* Musik & Medsos — row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                    Musik latar <span style={{ fontWeight: 400, color: '#aaa' }}>(opsional)</span>
                  </label>
                  <input
                    type="url"
                    value={musicUrl}
                    onChange={e => setMusicUrl(e.target.value)}
                    placeholder="https://... (mp3/ogg)"
                    disabled={busy}
                    style={{ ...inputStyle, resize: undefined }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                    Medsos / Hashtag <span style={{ fontWeight: 400, color: '#aaa' }}>(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={socialMedia}
                    onChange={e => setSocialMedia(e.target.value)}
                    placeholder="@username atau #hashtag"
                    disabled={busy}
                    style={{ ...inputStyle, resize: undefined }}
                  />
                </div>
              </div>

              {/* Tema bebas */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                  Tema tambahan <span style={{ fontWeight: 400, color: '#aaa' }}>(opsional)</span>
                </label>
                <textarea
                  value={aiTheme}
                  onChange={e => setAiTheme(e.target.value)}
                  placeholder="contoh: islami paper quilling, motif bulan sabit dan lentera, kesan 3D..."
                  rows={2}
                  disabled={busy}
                  style={textareaStyle}
                />
              </div>

              {/* Upload referensi */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                  Referensi desain <span style={{ fontWeight: 400, color: '#aaa' }}>(opsional)</span>
                </label>
                {refImage ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1fae5', background: '#f0fdf4' }}>
                    <img src={refImage} alt="ref" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#166534', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refImageName}</p>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>AI akan mencontoh gaya visual gambar ini</p>
                    </div>
                    <button onClick={() => { setRefImage(null); setRefImageName('') }} style={{ fontSize: 18, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: '1.5px dashed #d1d5db', cursor: busy ? 'default' : 'pointer', background: '#fafafa' }}>
                    <span style={{ fontSize: 18 }}>🖼️</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Upload gambar referensi (JPG/PNG, maks 4MB)</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={busy} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                  Detail acara <span style={{ fontWeight: 400, color: '#e53e3e' }}>*</span>
                </label>
                <textarea
                  value={aiDetails}
                  onChange={e => setAiDetails(e.target.value)}
                  placeholder={
                    isWedding
                      ? 'contoh: Pernikahan Arinda Putri dan Baskara Wijaya, Sabtu 14 Juni 2025, akad jam 08.00 resepsi jam 11.00–14.00 WIB, di The Sultan Hotel Yogyakarta, RSVP ke 08123456789'
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
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: canGenerate ? '#18181b' : '#e4e4e7',
                  color: canGenerate ? '#fff' : '#a1a1aa',
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  fontSize: 14, fontWeight: 500,
                  cursor: canGenerate ? 'pointer' : 'default',
                  transition: 'all .15s',
                }}
              >
                {aiLoading ? <><Spinner /> Membuat halaman...</> : <><span>✨</span> Generate Undangan</>}
              </button>
            </div>

            {/* Manual section */}
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 14px' }}>
                Atau isi manual — masukkan judul dulu, edit detail nanti
              </p>
              <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 10 }}>
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
                    borderRadius: 8, border: '1.5px solid #d4d4d8', fontSize: 13, fontWeight: 500,
                    cursor: title.trim() && !busy ? 'pointer' : 'default',
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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e8e8e8', fontSize: 13, boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit', color: '#1a1a1a',
  resize: 'vertical' as const,
}

const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid #e8e8e8', fontSize: 13, boxSizing: 'border-box',
  outline: 'none', fontFamily: 'inherit', resize: 'vertical' as const,
  color: '#1a1a1a', lineHeight: 1.6,
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
    </svg>
  )
}

function StepDot({ active, done, number, label }: { active: boolean; done: boolean; number: number; label: string }) {
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
