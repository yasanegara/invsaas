'use client'

import { useState } from 'react'
import type { TemplateId } from '@/templates/types'
import { TEMPLATE_META } from '@/templates/types'

const CATEGORIES = ['Semua', 'Pernikahan', 'Ulang Tahun']

const PREVIEW_BG: Record<TemplateId, string> = {
  'elegant-gold':  '#3a2e1a',
  'modern-clean':  '#1a1a1a',
  'romantic-pink': '#c05a8a',
  'birthday':      '#5b4fcf',
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
                transition: 'all .15s',
              }}
            >
              <div style={{ height: 100, background: PREVIEW_BG[id], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PreviewMini id={id} />
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{meta.label}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{meta.category}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PreviewMini({ id }: { id: TemplateId }) {
  const accent = TEMPLATE_META[id].accent
  const previews: Record<TemplateId, React.ReactNode> = {
    'elegant-gold': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: accent, fontSize: 9, letterSpacing: 2 }}>WEDDING</div>
        <div style={{ color: '#fff', fontSize: 15, marginTop: 4 }}>Arinda</div>
        <div style={{ color: accent, fontSize: 20 }}>&</div>
        <div style={{ color: '#fff', fontSize: 15 }}>Baskara</div>
      </div>
    ),
    'modern-clean': (
      <div>
        <div style={{ background: '#fff', color: '#1a1a1a', fontSize: 8, padding: '2px 6px', marginBottom: 8, letterSpacing: 1 }}>WEDDING</div>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 300 }}>Citra<br />Dhimas</div>
      </div>
    ),
    'romantic-pink': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#ffd6e8', fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>WITH LOVE</div>
        <div style={{ color: '#fff', fontSize: 15 }}>Ervina<br />& Fadhil</div>
        <div style={{ color: '#ffd6e8', fontSize: 18, marginTop: 4 }}>♥</div>
      </div>
    ),
    'birthday': (
      <div style={{ textAlign: 'center' }}>
        <div style={{ background: '#fff', color: accent, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginBottom: 8 }}>BIRTHDAY</div>
        <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>Galuh<br />turns 25!</div>
      </div>
    ),
  }
  return <>{previews[id]}</>
}
