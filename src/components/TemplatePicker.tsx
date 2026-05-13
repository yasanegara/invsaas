'use client'

import { useState } from 'react'
import type { TemplateId } from '@/templates/types'
import { TEMPLATE_META } from '@/templates/types'

const CATEGORIES = ['Semua', 'Pernikahan', 'Pernikahan Islami', 'Ulang Tahun', 'Khitanan', 'Aqiqah', 'Wisuda']

const PREVIEW_BG: Record<TemplateId, string> = {
  'elegant-gold':    '#2a1f0a',
  'modern-clean':    '#111111',
  'romantic-pink':   '#7d1a4a',
  'islamic-green':   '#022c22',
  'islamic-royal':   '#0c1f33',
  'birthday':        '#2d2060',
  'sweet-seventeen': '#6b0f3a',
  'khitanan-fun':    '#0c4a6e',
  'aqiqah-soft':     '#3b0764',
  'wisuda-formal':   '#0c1f33',
  'wisuda-modern':   '#042f2e',
}

interface Props {
  onSelect: (templateId: TemplateId) => void
}

export default function TemplatePicker({ onSelect }: Props) {
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [hovered, setHovered] = useState<TemplateId | null>(null)

  const filtered = (Object.keys(TEMPLATE_META) as TemplateId[]).filter(id =>
    activeCategory === 'Semua' || TEMPLATE_META[id].category === activeCategory
  )

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>Pilih template</h2>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>Bisa diubah sepenuhnya setelah dipilih</p>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: activeCategory === cat ? '#1a1a1a' : '#e0e0e0',
              background: activeCategory === cat ? '#1a1a1a' : 'transparent',
              color: activeCategory === cat ? '#fff' : '#666',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: activeCategory === cat ? 500 : 400,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {filtered.map(id => {
          const meta = TEMPLATE_META[id]
          const isHovered = hovered === id
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                border: `1.5px solid ${isHovered ? '#1a1a1a' : '#e0e0e0'}`,
                borderRadius: 12,
                padding: 0,
                overflow: 'hidden',
                background: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? '0 4px 16px rgba(0,0,0,0.1)' : 'none',
                transition: 'all .15s',
              }}
            >
              {/* Preview thumbnail */}
              <div style={{
                height: 100,
                background: PREVIEW_BG[id],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <PreviewMini id={id} />
              </div>

              {/* Info */}
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.accent, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</div>
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>{meta.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PreviewMini({ id }: { id: TemplateId }) {
  const { accent } = TEMPLATE_META[id]

  const previews: Record<TemplateId, React.ReactNode> = {
    'elegant-gold': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: accent, fontSize: 8, letterSpacing: 3, marginBottom: 4 }}>✦ WEDDING ✦</div>
        <div style={{ color: '#fff', fontSize: 14, fontStyle: 'italic' }}>Arinda</div>
        <div style={{ color: accent, fontSize: 18 }}>&</div>
        <div style={{ color: '#fff', fontSize: 14, fontStyle: 'italic' }}>Baskara</div>
      </div>
    ),
    'modern-clean': (
      <div>
        <div style={{ background: '#fff', color: '#1a1a1a', fontSize: 7, padding: '2px 8px', marginBottom: 10, letterSpacing: 2 }}>WEDDING INVITATION</div>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 200, lineHeight: 1.2 }}>Citra<br />& Dhimas</div>
      </div>
    ),
    'romantic-pink': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#ffd6e8', fontSize: 18, marginBottom: 4 }}>♥</div>
        <div style={{ color: '#fff', fontSize: 13, fontStyle: 'italic' }}>Ervina & Fadhil</div>
        <div style={{ color: '#ffd6e8', fontSize: 8, marginTop: 4, letterSpacing: 2 }}>WITH LOVE</div>
      </div>
    ),
    'islamic-green': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: accent, fontSize: 14, marginBottom: 4 }}>☪</div>
        <div style={{ color: '#fff', fontSize: 13, fontStyle: 'italic' }}>Hana & Rizki</div>
        <div style={{ color: accent, fontSize: 7, marginTop: 4, letterSpacing: 2 }}>BISMILLAH</div>
      </div>
    ),
    'islamic-royal': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#D4AF37', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>✦ بِسْمِ اللَّهِ ✦</div>
        <div style={{ color: '#fff', fontSize: 13 }}>Nabila & Faris</div>
        <div style={{ width: 40, height: 1, background: '#D4AF37', margin: '6px auto 0' }} />
      </div>
    ),
    'birthday': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ background: accent, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginBottom: 8 }}>🎉 BIRTHDAY</div>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Galuh<br />turns 25!</div>
      </div>
    ),
    'sweet-seventeen': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#fda4af', fontSize: 16, marginBottom: 4 }}>✨ 17 ✨</div>
        <div style={{ color: '#fff', fontSize: 13, fontStyle: 'italic' }}>Sweet Seventeen</div>
        <div style={{ color: '#fda4af', fontSize: 11, marginTop: 4 }}>Nayla</div>
      </div>
    ),
    'khitanan-fun': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#7dd3fc', fontSize: 14, marginBottom: 4 }}>☪ ⭐</div>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Khitanan</div>
        <div style={{ color: '#7dd3fc', fontSize: 11, marginTop: 4 }}>Rasya Putra</div>
      </div>
    ),
    'aqiqah-soft': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#d8b4fe', fontSize: 13, marginBottom: 4 }}>🌙 ⭐</div>
        <div style={{ color: '#fff', fontSize: 12 }}>Aqiqah</div>
        <div style={{ color: '#d8b4fe', fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>Baby Azzahra</div>
      </div>
    ),
    'wisuda-formal': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#D4AF37', fontSize: 18, marginBottom: 4 }}>🎓</div>
        <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>WISUDA</div>
        <div style={{ color: '#D4AF37', fontSize: 10, marginTop: 4, letterSpacing: 1 }}>S1 TEKNIK</div>
      </div>
    ),
    'wisuda-modern': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#5eead4', fontSize: 18, marginBottom: 4 }}>🎓</div>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Wisuda 2025</div>
        <div style={{ color: '#5eead4', fontSize: 10, marginTop: 4 }}>Universitas ...</div>
      </div>
    ),
  }

  return <>{previews[id]}</>
}
