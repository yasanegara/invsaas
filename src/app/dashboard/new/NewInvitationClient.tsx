'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { TemplateId } from '@/templates/types'
import { TEMPLATE_META } from '@/templates/types'

type Step = 'details' | 'preview'

// Encoded SVG patterns for background-image
const _arabeskSvg = `url("data:image/svg+xml,%3Csvg width='56' height='56' viewBox='0 0 56 56' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23D4AF37' fill-opacity='0.18' d='M28 4l3 10h10l-8 6 3 10-8-6-8 6 3-10-8-6h10zm0 28l3 10h10l-8 6 3 10-8-6-8 6 3-10-8-6h10z'/%3E%3C/svg%3E")`
const _batikSvg = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='8' fill='none' stroke='%23c4652a' stroke-opacity='0.2' stroke-width='1.5'/%3E%3Ccircle cx='0' cy='0' r='8' fill='none' stroke='%23c4652a' stroke-opacity='0.15' stroke-width='1'/%3E%3Ccircle cx='40' cy='0' r='8' fill='none' stroke='%23c4652a' stroke-opacity='0.15' stroke-width='1'/%3E%3Ccircle cx='0' cy='40' r='8' fill='none' stroke='%23c4652a' stroke-opacity='0.15' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='8' fill='none' stroke='%23c4652a' stroke-opacity='0.15' stroke-width='1'/%3E%3C/svg%3E")`

interface BgPreset {
  id: string
  label: string
  thumb: string  // CSS value for preview div background
  css: string | null  // CSS to inject into HTML (null = no override)
  prompt: string  // instruction for AI
}

const BACKGROUND_PRESETS: BgPreset[] = [
  {
    id: 'none',
    label: 'Default AI',
    thumb: 'linear-gradient(135deg,#f0f0ee,#e0e0dc)',
    css: null,
    prompt: '',
  },
  {
    id: 'emas-krem',
    label: 'Emas & Krem',
    thumb: 'linear-gradient(135deg,#c9a94e,#f5e6c8,#e8d5a3)',
    css: `html,body{background:linear-gradient(160deg,#fffdf5 0%,#fdf6e0 35%,#f5e6c8 65%,#fffdf5 100%)!important;background-attachment:fixed!important}`,
    prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai inline style background:linear-gradient(160deg,#fffdf5 0%,#fdf6e0 35%,#f5e6c8 65%,#fffdf5 100%). Jangan pakai background warna lain. Gunakan teks gelap (#3a2800, #6b4c00) agar terbaca.',
  },
  {
    id: 'emerald',
    label: 'Emerald Islam',
    thumb: 'linear-gradient(135deg,#022c22,#065f46,#0d9488)',
    css: `html,body{background:linear-gradient(160deg,#022c22 0%,#064e3b 45%,#065f46 75%,#022c22 100%)!important;background-attachment:fixed!important}`,
    prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai inline style background:linear-gradient(160deg,#022c22 0%,#064e3b 45%,#065f46 75%,#022c22 100%). Jangan pakai background warna lain. Gunakan teks putih (#fdfbf7) dan aksen emas (#d4af37) agar terbaca.',
  },
  {
    id: 'navy-gold',
    label: 'Navy & Emas',
    thumb: 'linear-gradient(135deg,#0f172a,#1e3a5f,#c9a94e40)',
    css: `html,body{background:linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)!important;background-attachment:fixed!important}`,
    prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai inline style background:linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%). Jangan pakai background warna lain. Gunakan teks putih dan aksen emas #D4AF37 agar terbaca.',
  },
  {
    id: 'marble',
    label: 'Marmer Putih',
    thumb: 'linear-gradient(135deg,#f8f8f6,#e8e4df,#f2ede8)',
    css: `html,body{background-color:#f5f3f0!important;background-image:repeating-linear-gradient(45deg,transparent,transparent 60px,rgba(200,190,180,.1) 60px,rgba(200,190,180,.1) 61px),repeating-linear-gradient(-45deg,transparent,transparent 80px,rgba(180,170,160,.07) 80px,rgba(180,170,160,.07) 81px)!important}`,
    prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai inline style background-color:#f5f3f0 dan background-image repeating-linear-gradient diagonal tipis. Jangan pakai background warna lain. Gunakan teks gelap (#1a1a1a) agar terbaca.',
  },
  {
    id: 'sakura',
    label: 'Sakura Rose',
    thumb: 'linear-gradient(135deg,#fff0f5,#fce7f3,#fbcfe8)',
    css: `html,body{background:linear-gradient(160deg,#fff0f5 0%,#fce7f3 40%,#ffe4e6 70%,#fff0f5 100%)!important;background-attachment:fixed!important}`,
    prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai inline style background:linear-gradient(160deg,#fff0f5 0%,#fce7f3 40%,#ffe4e6 70%,#fff0f5 100%). Jangan pakai background warna lain. Gunakan teks rose (#4a0020) agar terbaca.',
  },
  {
    id: 'arabesque',
    label: 'Arabesque',
    thumb: 'linear-gradient(135deg,#1a2a4a,#243556)',
    css: `html,body{background-color:#1a2a4a!important;background-image:${_arabeskSvg}!important}`,
    prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai inline style background-color:#1a2a4a. Jangan pakai background warna lain. Gunakan teks putih/krem dan aksen emas #D4AF37 agar terbaca.',
  },
  {
    id: 'batik',
    label: 'Batik Jawa',
    thumb: 'linear-gradient(135deg,#fdf3e7,#f5e6c8)',
    css: `html,body{background-color:#fdf3e7!important;background-image:${_batikSvg}!important}`,
    prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai inline style background-color:#fdf3e7. Jangan pakai background warna lain. Gunakan teks coklat gelap (#4a2c10) agar terbaca.',
  },
  {
    id: 'lavender',
    label: 'Lavender',
    thumb: 'linear-gradient(135deg,#2e1065,#4c1d95,#7c3aed)',
    css: `html,body{background:linear-gradient(160deg,#2e1065 0%,#4c1d95 45%,#5b21b6 75%,#2e1065 100%)!important;background-attachment:fixed!important}`,
    prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai inline style background:linear-gradient(160deg,#2e1065 0%,#4c1d95 45%,#5b21b6 75%,#2e1065 100%). Jangan pakai background warna lain. Gunakan teks putih dan aksen silver/gold agar terbaca.',
  },
  {
    id: 'earth',
    label: 'Earth Tone',
    thumb: 'linear-gradient(135deg,#fdf3e7,#f5dab0,#e8c07a)',
    css: `html,body{background:linear-gradient(160deg,#fdf6ec 0%,#f5e6c8 40%,#fde8c8 70%,#fdf6ec 100%)!important;background-attachment:fixed!important}`,
    prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai inline style background:linear-gradient(160deg,#fdf6ec 0%,#f5e6c8 40%,#fde8c8 70%,#fdf6ec 100%). Jangan pakai background warna lain. Gunakan teks terakota gelap (#7c3417) agar terbaca.',
  },
]

interface InvField { key: string; label: string; multiline?: boolean }
interface InvSection { id: string; label: string; icon: string; fields: InvField[] }

interface EventFieldDef { key: string; label: string; placeholder: string; required?: boolean; multiline?: boolean; half?: boolean }

const EVENT_FIELDS: Record<string, EventFieldDef[]> = {
  wedding: [
    { key: 'nama_wanita',    label: 'Nama mempelai wanita', placeholder: 'Arinda Putri Rahayu', required: true, half: true },
    { key: 'nama_pria',      label: 'Nama mempelai pria',   placeholder: 'Baskara Wijaya',       required: true, half: true },
    { key: 'tanggal',        label: 'Tanggal pernikahan',   placeholder: 'Sabtu, 14 Juni 2025',  required: true, half: true },
    { key: 'akad_time',      label: 'Waktu akad',           placeholder: '08.00 WIB',            half: true },
    { key: 'akad_venue',     label: 'Venue akad',           placeholder: 'Masjid Al-Hikmah',     half: true },
    { key: 'akad_address',   label: 'Alamat akad',          placeholder: 'Jl. Mawar No. 1, Jakarta', multiline: true },
    { key: 'resepsi_time',   label: 'Waktu resepsi',        placeholder: '11.00 – 14.00 WIB',    half: true },
    { key: 'resepsi_venue',  label: 'Venue resepsi',        placeholder: 'The Sultan Hotel',      half: true },
    { key: 'resepsi_address',label: 'Alamat resepsi',       placeholder: 'Jl. Sudirman No. 1, Yogyakarta', multiline: true },
    { key: 'wa_rsvp',        label: 'Nomor WA RSVP',        placeholder: '08123456789',           half: true },
    { key: 'hashtag',        label: 'Hashtag',              placeholder: '#ArindaBaskara2025',    half: true },
  ],
  birthday: [
    { key: 'nama',    label: 'Nama',              placeholder: 'Galuh Pramesti', required: true, half: true },
    { key: 'usia',    label: 'Ulang tahun ke-',   placeholder: '25',             half: true },
    { key: 'tanggal', label: 'Tanggal acara',     placeholder: 'Sabtu, 14 Juni 2025', required: true, half: true },
    { key: 'waktu',   label: 'Waktu acara',       placeholder: '19.00 WIB',      required: true, half: true },
    { key: 'venue',   label: 'Tempat / venue',    placeholder: 'Rooftop Kemang', required: true, half: true },
    { key: 'address', label: 'Alamat',            placeholder: 'Jl. Kemang Raya No. 8, Jakarta', multiline: true },
    { key: 'dresscode',label: 'Dresscode',        placeholder: 'All Purple',     half: true },
    { key: 'wa_rsvp', label: 'Nomor WA RSVP',    placeholder: '08123456789',    half: true },
  ],
  ceremony: [
    { key: 'nama_anak',  label: 'Nama anak',        placeholder: 'Muhammad Rasya Putra',    required: true, half: true },
    { key: 'nama_ortu',  label: 'Nama orang tua',   placeholder: 'Bapak Ahmad & Ibu Sari', required: true, half: true },
    { key: 'tanggal',    label: 'Tanggal acara',     placeholder: 'Ahad, 15 Juni 2025',     required: true, half: true },
    { key: 'waktu',      label: 'Waktu acara',       placeholder: '09.00 WIB',              required: true, half: true },
    { key: 'venue',      label: 'Tempat / venue',    placeholder: 'Gedung Serbaguna',       required: true, half: true },
    { key: 'address',    label: 'Alamat',            placeholder: 'Jl. Melati No. 5, Bandung', multiline: true },
    { key: 'wa_rsvp',    label: 'Nomor WA RSVP',    placeholder: '08123456789',             half: true },
  ],
  graduation: [
    { key: 'nama',        label: 'Nama wisudawan/ti', placeholder: 'Siti Nurhaliza',       required: true, half: true },
    { key: 'prodi',       label: 'Program studi',     placeholder: 'Teknik Informatika',   required: true, half: true },
    { key: 'universitas', label: 'Universitas',       placeholder: 'Universitas Indonesia',required: true },
    { key: 'tanggal',     label: 'Tanggal wisuda',    placeholder: 'Sabtu, 14 Juni 2025',  required: true, half: true },
    { key: 'waktu',       label: 'Waktu acara',       placeholder: '09.00 WIB',            required: true, half: true },
    { key: 'venue',       label: 'Gedung / tempat',   placeholder: 'Balairung UI',         required: true, half: true },
    { key: 'address',     label: 'Alamat',            placeholder: 'Kampus UI Depok',      multiline: true },
    { key: 'dresscode',   label: 'Dresscode',         placeholder: 'Batik Formal',         half: true },
    { key: 'wa_rsvp',     label: 'Nomor WA RSVP',    placeholder: '08123456789',           half: true },
  ],
}

function buildDetails(fields: Record<string, string>, eventType: string): string {
  const defs = EVENT_FIELDS[eventType] ?? EVENT_FIELDS.wedding
  return defs
    .filter(d => fields[d.key]?.trim())
    .map(d => `${d.label}: ${fields[d.key].trim()}`)
    .join('\n')
}

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

function injectBackground(html: string, css: string): string {
  // Apply the same background to html/body AND every section element
  const expandedCss = css.replace('html,body{', 'html,body,[id^="section-"]{')
  const tag = `<style id="bg-override">${expandedCss}</style>`
  return html.includes('<head>') ? html.replace('<head>', '<head>' + tag) : tag + html
}

function makePreviewSrc(html: string): string {
  const style = `<style>#cover{display:none!important}#content{display:block!important;opacity:1!important}</style>`
  const listener = `<script>window.addEventListener('message',function(e){if(!e.data||e.data.type!=='scrollTo')return;var ids=e.data.ids||[];for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});break;}}});</` + `script>`
  let result = html.includes('<head>') ? html.replace('<head>', '<head>' + style) : style + html
  result = result.includes('</body>') ? result.replace('</body>', listener + '</body>') : result + listener
  return result
}

export default function NewInvitationClient() {
  const [step, setStep] = useState<Step>('details')
  const [templateId, setTemplateId] = useState<TemplateId | null>('paper-quilling-islami')
  const [aiTheme, setAiTheme] = useState('')
  const [eventFields, setEventFields] = useState<Record<string, string>>({})
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPhase, setAiPhase] = useState<'brief' | 'html' | null>(null)
  const [error, setError] = useState('')

  const [musicUrl, setMusicUrl] = useState<string>('')
  const [socialMedia, setSocialMedia] = useState<string>('')

  // Background preset
  const [bgPresetId, setBgPresetId] = useState<string>('none')
  const [bgCustomImage, setBgCustomImage] = useState<string | null>(null)
  const [bgCustomImageName, setBgCustomImageName] = useState('')

  // Referensi gambar
  const [refImage, setRefImage] = useState<string | null>(null)
  const [refImageName, setRefImageName] = useState('')

  // Preview/edit step
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [sections, setSections] = useState<InvSection[]>([])
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [generatedTitle, setGeneratedTitle] = useState('')

  const previewIframeRef = useRef<HTMLIFrameElement>(null)
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  const router = useRouter()
  const isWedding = templateId ? TEMPLATE_META[templateId].eventType === 'wedding' : true
  const eventType = templateId ? TEMPLATE_META[templateId].eventType : 'wedding'
  const busy = loading || aiLoading
  const requiredKeys = (EVENT_FIELDS[eventType] ?? []).filter(f => f.required).map(f => f.key)
  const canGenerate = requiredKeys.some(k => eventFields[k]?.trim()) && !busy

  function handleTemplateSelect(id: TemplateId) {
    setTemplateId(id)
    setStep('details')
  }

  async function handleManualSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!title.trim() || !templateId) return
    await createInvitation({ title: title.trim() })
  }

  function handleBgImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setError('Gambar terlalu besar, maks 4MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      setBgCustomImage(ev.target?.result as string)
      setBgCustomImageName(file.name)
      setBgPresetId('custom')
      setError('')
    }
    reader.readAsDataURL(file)
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
    if (!canGenerate || !templateId) return
    const detailsStr = buildDetails(eventFields, eventType)
    setAiLoading(true)
    setAiPhase('brief')
    setError('')
    try {
      const selectedBg = bgCustomImage
        ? { css: `html,body,[id^="section-"]{background-image:url('${bgCustomImage}')!important;background-size:cover!important;background-position:center!important;background-attachment:fixed!important}`, prompt: 'BACKGROUND PER SECTION: html, body, dan SETIAP section (id^="section-") WAJIB pakai background:transparent agar gambar background html/body terlihat di seluruh halaman. Sesuaikan warna teks dengan gambar (teks terang jika gambar gelap, teks gelap jika gambar terang).' }
        : BACKGROUND_PRESETS.find(p => p.id === bgPresetId) ?? BACKGROUND_PRESETS[0]

      const stylePrompt = [
        selectedBg.prompt,
        musicUrl.trim() ? `MUSIK: embed <audio src="${musicUrl.trim()}" loop autoplay> dan floating button play/pause fixed bottom-right` : '',
        socialMedia.trim() ? `MEDSOS/HASHTAG: tampilkan "${socialMedia.trim()}" di section footer` : '',
        aiTheme.trim(),
      ].filter(Boolean).join('\n')

      // ── Pass 1: design brief ───────────────────────────────────────────
      let brief = ''
      try {
        const briefRes = await fetch('/api/ai/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: stylePrompt, details: detailsStr, templateId, refImage }),
        })
        if (briefRes.ok) {
          const briefData = await briefRes.json()
          brief = briefData.brief ?? ''
        }
      } catch { /* brief gagal — lanjut tanpa brief */ }

      // ── Pass 2: generate HTML ──────────────────────────────────────────
      setAiPhase('html')
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: stylePrompt, details: detailsStr, templateId, refImage, brief }),
      })
      const data = await res.json()
      if (!res.ok || !data.customHtml) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const finalHtml = selectedBg.css
        ? injectBackground(data.customHtml, selectedBg.css)
        : data.customHtml

      const { sections: detected, values } = extractSections(finalHtml)
      setGeneratedHtml(finalHtml)
      setPreviewHtml(finalHtml)
      setSections(detected)
      setEditValues(values)
      setActiveSection(detected[0]?.id ?? null)
      setGeneratedTitle(data.title || detailsStr.slice(0, 60))
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI gagal generate, coba lagi.')
    } finally {
      setAiLoading(false)
      setAiPhase(null)
    }
  }

  function updateField(key: string, value: string) {
    setEditValues(prev => ({ ...prev, [key]: value }))
    setGeneratedHtml(prev => {
      if (!prev) return prev
      const updated = applyEdit(prev, key, value)
      clearTimeout(previewDebounceRef.current)
      previewDebounceRef.current = setTimeout(() => setPreviewHtml(updated), 400)
      return updated
    })
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
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      router.push(`/dashboard/edit/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.')
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
            {error && <span style={{ fontSize: 11, color: '#e53e3e', maxWidth: 360, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error}</span>}
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
                      onClick={() => {
                        setActiveSection(sec.id)
                        setTimeout(() => {
                          previewIframeRef.current?.contentWindow?.postMessage({ type: 'scrollTo', ids: [sec.id] }, '*')
                        }, 60)
                      }}
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
                  ref={previewIframeRef}
                  srcDoc={makePreviewSrc(previewHtml ?? generatedHtml)}
                  onLoad={() => {
                    if (activeSection) {
                      setTimeout(() => {
                        previewIframeRef.current?.contentWindow?.postMessage({ type: 'scrollTo', ids: [activeSection] }, '*')
                      }, 100)
                    }
                  }}
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
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>

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
                AI membuat satu halaman undangan digital yang unik. Setelah generate, kamu bisa edit per section.
              </p>

              {/* Background undangan */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 10 }}>Background undangan</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {BACKGROUND_PRESETS.map(bg => {
                    const active = bgPresetId === bg.id && !bgCustomImage
                    return (
                      <button
                        key={bg.id}
                        onClick={() => { setBgPresetId(bg.id); setBgCustomImage(null); setBgCustomImageName('') }}
                        disabled={busy}
                        title={bg.label}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                          padding: '6px 4px', borderRadius: 8, cursor: busy ? 'default' : 'pointer',
                          border: active ? '2px solid #1a1a1a' : '1.5px solid #e0e0e0',
                          background: active ? '#f5f5f5' : '#fff',
                        }}
                      >
                        <div style={{
                          width: 48, height: 32, borderRadius: 5,
                          background: bg.thumb,
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          {active && (
                            <div style={{
                              position: 'absolute', inset: 0, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(0,0,0,0.25)',
                            }}>
                              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 10, color: '#555', textAlign: 'center', lineHeight: 1.2 }}>{bg.label}</span>
                      </button>
                    )
                  })}

                  {/* Custom upload */}
                  <label
                    title="Upload gambar background"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '6px 4px', borderRadius: 8, cursor: busy ? 'default' : 'pointer',
                      border: bgCustomImage ? '2px solid #1a1a1a' : '1.5px dashed #c0c0c0',
                      background: bgCustomImage ? '#f5f5f5' : '#fafafa',
                    }}
                  >
                    <div style={{
                      width: 48, height: 32, borderRadius: 5, overflow: 'hidden',
                      background: bgCustomImage ? `url(${bgCustomImage}) center/cover` : '#f0f0ee',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!bgCustomImage && <span style={{ fontSize: 16 }}>+</span>}
                      {bgCustomImage && <div style={{ position: 'relative', width: '100%', height: '100%', backgroundImage: `url(${bgCustomImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span></div></div>}
                    </div>
                    <span style={{ fontSize: 10, color: '#555', textAlign: 'center', lineHeight: 1.2 }}>
                      {bgCustomImage ? bgCustomImageName.slice(0, 8) + '…' : 'Upload'}
                    </span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBgImageUpload} disabled={busy} style={{ display: 'none' }} />
                  </label>
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

              {/* Deskripsi gaya bebas — PRIMARY INPUT */}
              <div style={{ marginBottom: 16, background: '#fafafa', borderRadius: 10, padding: '14px 16px', border: '1.5px solid #e8e8e8' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 4 }}>
                  Gambarkan gaya undanganmu
                </label>
                <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 8px' }}>
                  Tulis bebas — nuansa, tema, inspirasi, warna favorit, dll.
                </p>
                <textarea
                  value={aiTheme}
                  onChange={e => setAiTheme(e.target.value)}
                  placeholder={'contoh: "Nuansa islami elegan, dominan hijau emerald dan emas, ornamen arabesque, font kaligrafi arab, kesan mewah dan sakral"\natau: "Modern minimalis, hitam putih, tipografi tegas, tidak perlu banyak ornamen"\natau: "Seperti undangan Bali — bunga kamboja, warna coklat earth tone, foto prewedding di sawah"'}
                  rows={4}
                  disabled={busy}
                  style={{ ...textareaStyle, background: '#fff' }}
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

              {/* Structured event fields */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 10 }}>
                  Data acara <span style={{ fontWeight: 400, color: '#e53e3e', fontSize: 11 }}>* wajib</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(EVENT_FIELDS[eventType] ?? []).map(f => (
                    <div key={f.key} style={{ gridColumn: f.multiline || !f.half ? '1 / -1' : undefined }}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: f.required ? '#555' : '#888', display: 'block', marginBottom: 4 }}>
                        {f.label}{f.required ? ' *' : ' (opsional)'}
                      </label>
                      {f.multiline ? (
                        <textarea
                          value={eventFields[f.key] ?? ''}
                          onChange={e => setEventFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          rows={2}
                          disabled={busy}
                          style={textareaStyle}
                        />
                      ) : (
                        <input
                          type="text"
                          value={eventFields[f.key] ?? ''}
                          onChange={e => setEventFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          disabled={busy}
                          style={inputStyle}
                        />
                      )}
                    </div>
                  ))}
                </div>
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
                {aiLoading
                  ? <><Spinner /> {aiPhase === 'brief' ? 'Merancang konsep desain...' : 'Membuat halaman undangan...'}</>
                  : <><span>✨</span> Generate Undangan</>}
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
