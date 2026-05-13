'use client'

import { useEffect, useState } from 'react'

type Config = Record<string, string>

const FIELDS = [
  {
    key: 'model',
    label: 'Model AI',
    type: 'text',
    placeholder: 'anthropic/claude-sonnet-4-6',
    hint: 'Format: provider/model-name (e.g. anthropic/claude-sonnet-4-6, openai/gpt-4o)',
  },
  {
    key: 'temperature',
    label: 'Temperature',
    type: 'text',
    placeholder: '0.8',
    hint: '0.0 = deterministik, 1.0 = kreatif maksimal',
  },
  {
    key: 'max_tokens',
    label: 'Max Tokens',
    type: 'text',
    placeholder: '8000',
    hint: 'Batas panjang output HTML. Minimal 6000 untuk undangan lengkap.',
  },
  {
    key: 'role',
    label: 'ROLE (Identitas AI)',
    type: 'textarea',
    placeholder: 'Kamu adalah front-end developer senior Indonesia...',
    hint: 'Siapa AI ini? Kepribadian dan keahlian utamanya.',
    rows: 3,
  },
  {
    key: 'task',
    label: 'TASK (Tugas Utama)',
    type: 'textarea',
    placeholder: 'Buat satu halaman undangan digital...',
    hint: 'Apa yang harus dihasilkan AI?',
    rows: 3,
  },
  {
    key: 'constraint_data',
    label: 'CONSTRAINTS — Data & Akurasi',
    type: 'textarea',
    placeholder: '- GUNAKAN PERSIS data dari user...',
    hint: 'Aturan akurasi data: anti-hallusinasi nama, tanggal, nomor WA, ayat Al-Qur\'an.',
    rows: 6,
  },
  {
    key: 'constraint_output',
    label: 'CONSTRAINTS — Output Format',
    type: 'textarea',
    placeholder: '- Output HANYA kode HTML...',
    hint: 'Format output yang diharapkan dari AI.',
    rows: 4,
  },
  {
    key: 'constraint_technical',
    label: 'CONSTRAINTS — Teknis HTML/CSS',
    type: 'textarea',
    placeholder: '- Semua background wajib inline style...',
    hint: 'Aturan teknis: inline style, SVG, Tailwind CDN, dst.',
    rows: 4,
  },
  {
    key: 'visual_standard',
    label: 'Standar Visual',
    type: 'textarea',
    placeholder: '- Background tiap section: gradient unik...',
    hint: 'Panduan kualitas visual: gradient, ornamen, animasi, tombol, warna.',
    rows: 8,
  },
  {
    key: 'prompt_head_rules',
    label: 'HEAD & Background Rules',
    type: 'textarea',
    placeholder: '━━━ HEAD WAJIB ━━━\n<head> harus berisi...',
    hint: 'Instruksi isi <head> (Tailwind CDN, Google Fonts, tailwind.config) + aturan inline style background.',
    rows: 12,
  },
  {
    key: 'prompt_page_structure',
    label: 'Struktur Halaman (Cover + Konten + JS)',
    type: 'textarea',
    placeholder: '━━━ STRUKTUR HALAMAN WAJIB ━━━\nBAGIAN 1 — Cover (id="cover")...',
    hint: 'Instruksi cover, id="content", JavaScript openInvitation(). Edit di sini untuk ubah animasi atau struktur dasar.',
    rows: 14,
  },
  {
    key: 'prompt_data_edit',
    label: 'Data-Edit Requirements (Common)',
    type: 'textarea',
    placeholder: '━━━ DATA-EDIT ATTRIBUTES — WAJIB KRITIS ━━━\n⚠️ SETIAP teks...',
    hint: 'Instruksi wajib data-edit + contoh BENAR/SALAH + daftar cover/hero/pesan. Bagian event-specific (akad, resepsi, dll) diinjeksi otomatis per tipe template.',
    rows: 20,
  },
  {
    key: 'prompt_kamus_desain',
    label: 'Kamus Desain',
    type: 'textarea',
    placeholder: '━━━ KAMUS DESAIN ━━━\nJika parameter gaya visual disebutkan...',
    hint: 'Peta gaya visual → CSS teknik. Tambah gaya baru di sini agar AI langsung bisa menerapkannya.',
    rows: 16,
  },
]

export default function AiBrainPage() {
  const [config, setConfig] = useState<Config>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testDetails, setTestDetails] = useState('Pernikahan Andi & Budi, 25 Desember 2025, Gedung Serbaguna, Jakarta')
  const [testTemplateId, setTestTemplateId] = useState('elegant-gold')
  const [testHtml, setTestHtml] = useState('')
  const [testError, setTestError] = useState('')
  const [testing, setTesting] = useState(false)
  const [previewMode, setPreviewMode] = useState<'phone' | 'raw'>('phone')

  useEffect(() => {
    fetch('/api/admin/ai-config')
      .then(r => r.json())
      .then(d => {
        if (d.config) setConfig(d.config)
        else setError(d.error ?? 'Gagal load config')
      })
      .catch(() => setError('Gagal terhubung ke server'))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const r = await fetch('/api/admin/ai-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })
      const d = await r.json()
      if (d.success) setSaved(true)
      else setError(d.error ?? 'Gagal menyimpan')
    } catch {
      setError('Gagal terhubung ke server')
    } finally {
      setSaving(false)
    }
  }

  async function reset() {
    if (!confirm('Reset semua config ke default? Tidak bisa dibatalkan.')) return
    setResetting(true)
    setError('')
    try {
      const r = await fetch('/api/admin/ai-config', { method: 'POST' })
      const d = await r.json()
      if (d.success) {
        const fresh = await fetch('/api/admin/ai-config').then(x => x.json())
        if (fresh.config) setConfig(fresh.config)
        setSaved(true)
      } else {
        setError(d.error ?? 'Gagal reset')
      }
    } catch {
      setError('Gagal terhubung ke server')
    } finally {
      setResetting(false)
    }
  }

  async function testGenerate() {
    setTesting(true)
    setTestHtml('')
    setTestError('')
    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details: testDetails, templateId: testTemplateId }),
      })
      const d = await r.json()
      if (d.customHtml) {
        setTestHtml(d.customHtml)
      } else {
        setTestError(d.error ?? 'Tidak ada HTML')
      }
    } catch (e) {
      setTestError(String(e))
    } finally {
      setTesting(false)
    }
  }

  function makePreviewSrc(html: string) {
    const style = `<style>#cover{display:none!important}#content{display:block!important;opacity:1!important}</style>`
    return html.includes('<head>') ? html.replace('<head>', '<head>' + style) : style + html
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', color: '#fff' }}>
        <p>Memuat konfigurasi...</p>
      </div>
    )
  }

  if (error && Object.keys(config).length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f87171', marginBottom: 8 }}>{error}</p>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Pastikan kamu login sebagai SUPERADMIN</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1f2937', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#fff' }}>AI Brain</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Kelola system prompt & konfigurasi AI</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 13, color: '#34d399' }}>Tersimpan ✓</span>}
          {error && <span style={{ fontSize: 13, color: '#f87171' }}>{error}</span>}
          <button
            onClick={reset}
            disabled={resetting}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}
          >
            {resetting ? 'Mereset...' : 'Reset Default'}
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: saving ? '#374151' : '#7c3aed', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px' }}>
        {/* Model settings */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Pengaturan Model</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {FIELDS.slice(0, 3).map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#d1d5db', marginBottom: 6 }}>{f.label}</label>
                <input
                  value={config[f.key] ?? ''}
                  onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#1f2937', color: '#f9fafb', fontSize: 14, boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{f.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System prompt sections */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>System Prompt</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {FIELDS.slice(3).map(f => (
              <div key={f.key} style={{ background: '#111827', borderRadius: 12, padding: 20, border: '1px solid #1f2937' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#f9fafb', marginBottom: 4 }}>{f.label}</label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, marginTop: 0 }}>{f.hint}</p>
                <textarea
                  value={config[f.key] ?? ''}
                  onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                  rows={f.rows ?? 4}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0f0f0f', color: '#f9fafb', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Test generate + sandbox */}
        <div style={{ marginTop: 48, background: '#111827', borderRadius: 12, border: '1px solid #1f2937', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1f2937' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, marginTop: 0 }}>Sandbox — Test Generate</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0, marginBottom: 0 }}>Uji config aktif dari DB. Hasilnya langsung tampil di preview.</p>
          </div>

          <div style={{ padding: 24 }}>
            {/* Template picker */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[
                { id: 'elegant-gold', label: '💍 Pernikahan' },
                { id: 'birthday-fun', label: '🎂 Ulang Tahun' },
              ].map(t => (
                <button key={t.id} onClick={() => setTestTemplateId(t.id)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: testTemplateId === t.id ? '2px solid #7c3aed' : '1px solid #374151',
                  background: testTemplateId === t.id ? '#4c1d95' : 'transparent',
                  color: testTemplateId === t.id ? '#fff' : '#9ca3af', cursor: 'pointer',
                }}>{t.label}</button>
              ))}
            </div>

            {/* Details input */}
            <textarea
              value={testDetails}
              onChange={e => setTestDetails(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0f0f0f', color: '#f9fafb', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
            />

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={testGenerate}
                disabled={testing}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: testing ? '#374151' : '#059669', color: '#fff', cursor: testing ? 'default' : 'pointer', fontWeight: 600, fontSize: 14 }}
              >
                {testing ? '⏳ Generating...' : '▶ Run Generate'}
              </button>
              {testHtml && (
                <>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['phone', 'raw'] as const).map(m => (
                      <button key={m} onClick={() => setPreviewMode(m)} style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 12,
                        border: previewMode === m ? '1px solid #7c3aed' : '1px solid #374151',
                        background: previewMode === m ? '#4c1d95' : 'transparent',
                        color: previewMode === m ? '#fff' : '#9ca3af', cursor: 'pointer',
                      }}>{m === 'phone' ? '📱 Phone' : '</> HTML'}</button>
                    ))}
                  </div>
                  <a
                    href={`data:text/html;charset=utf-8,${encodeURIComponent(testHtml)}`}
                    download="preview.html"
                    style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}
                  >
                    ↓ Download HTML
                  </a>
                </>
              )}
              {testError && <span style={{ fontSize: 13, color: '#f87171' }}>Error: {testError}</span>}
            </div>
          </div>

          {/* Preview area */}
          {testHtml && (
            <div style={{ borderTop: '1px solid #1f2937' }}>
              {previewMode === 'phone' ? (
                <div style={{ padding: 32, display: 'flex', justifyContent: 'center', background: '#0a0a0a' }}>
                  {/* Phone frame */}
                  <div style={{ width: 320, height: 640, border: '12px solid #222', borderRadius: 44, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', background: '#000' }}>
                    <div style={{ height: 24, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 60, height: 6, borderRadius: 3, background: '#333' }} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                      <iframe
                        srcDoc={makePreviewSrc(testHtml)}
                        style={{ width: 390, height: 780, border: 'none', display: 'block', transform: 'scale(0.744)', transformOrigin: 'top left' }}
                        sandbox="allow-scripts allow-popups allow-forms"
                        title="preview"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <pre style={{ margin: 0, padding: 24, background: '#0a0a0a', fontSize: 11, color: '#6b7280', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 480, overflowY: 'auto' }}>
                  {testHtml}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
