'use client'

import { useEffect } from 'react'
import type { TemplateId } from '@/templates/types'

interface Props {
  onSelect: (templateId: TemplateId) => void
}

export default function TemplatePicker({ onSelect }: Props) {
  // Hanya 1 template — auto-highlight, klik untuk lanjut
  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>Pilih template</h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Klik untuk mulai, semua detail bisa diubah dengan AI</p>

      <button
        onClick={() => onSelect('paper-quilling-islami')}
        style={{
          width: '100%', border: '2px solid #D4AF37', borderRadius: 16,
          padding: 0, overflow: 'hidden', background: '#fff',
          cursor: 'pointer', textAlign: 'left',
          boxShadow: '0 4px 24px rgba(212,175,55,0.18)',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(212,175,55,0.28)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'none'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(212,175,55,0.18)'
        }}
      >
        {/* Preview area */}
        <div style={{
          height: 220, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, #FDFBF7 0%, #f0ebe1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PaperQuillingPreview />
        </div>

        {/* Info */}
        <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #f0e8d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: '3px 10px',
              borderRadius: 20, background: '#fef9ee', color: '#b8882a', border: '1px solid #e8d5a0',
              textTransform: 'uppercase',
            }}>Pernikahan Islami</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
            Paper Quilling Islami
          </div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
            Ornamen gulungan kertas 3D, emerald & emas, nuansa sakral mewah
          </div>
          <div style={{
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, color: '#b8882a',
          }}>
            <span>✦</span>
            <span>Klik untuk pilih template ini</span>
            <span style={{ marginLeft: 'auto', fontSize: 18 }}>→</span>
          </div>
        </div>
      </button>
    </div>
  )
}

function PaperQuillingPreview() {
  return (
    <svg width="360" height="220" viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <defs>
        <style>{`
          @keyframes floatOrn { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(3deg)} }
          @keyframes floatOrn2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-4px) rotate(-2deg)} }
          @keyframes shimmerText { 0%,100%{opacity:1} 50%{opacity:.7} }
          .orn1 { animation: floatOrn 3.5s ease-in-out infinite; transform-origin: 50% 50%; }
          .orn2 { animation: floatOrn2 4s ease-in-out infinite 0.5s; transform-origin: 50% 50%; }
          .shimmer { animation: shimmerText 2.5s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* Background krem */}
      <rect width="360" height="220" fill="#FDFBF7"/>

      {/* Border arabesk tipis */}
      <rect x="6" y="6" width="348" height="208" rx="12" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 3" opacity=".5"/>

      {/* ── Ornamen sudut kiri atas — Paper Quilling spiral ── */}
      <g className="orn1" transform="translate(8,8)">
        {/* Spiral emerald besar */}
        <path d="M10,10 Q30,5 35,20 Q40,35 25,40 Q10,45 8,30 Q6,15 18,12" fill="none" stroke="#065f46" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18,12 Q32,8 36,22 Q40,36 27,39 Q14,42 12,30 Q10,18 20,15" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
        {/* Daun kecil */}
        <ellipse cx="38" cy="14" rx="5" ry="3" fill="#065f46" transform="rotate(-30 38 14)" opacity=".8"/>
        <ellipse cx="12" cy="42" rx="4" ry="2.5" fill="#D4AF37" transform="rotate(20 12 42)" opacity=".8"/>
        {/* Bintang kecil */}
        <polygon points="45,8 46.5,12 51,12 47.5,14.5 49,18.5 45,16 41,18.5 42.5,14.5 39,12 43.5,12" fill="#D4AF37" opacity=".9" transform="scale(0.6) translate(28,2)"/>
      </g>

      {/* ── Ornamen sudut kanan atas ── */}
      <g className="orn2" transform="translate(352,8) scale(-1,1)">
        <path d="M10,10 Q30,5 35,20 Q40,35 25,40 Q10,45 8,30 Q6,15 18,12" fill="none" stroke="#065f46" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18,12 Q32,8 36,22 Q40,36 27,39 Q14,42 12,30 Q10,18 20,15" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="38" cy="14" rx="5" ry="3" fill="#065f46" transform="rotate(-30 38 14)" opacity=".8"/>
        <ellipse cx="12" cy="42" rx="4" ry="2.5" fill="#D4AF37" transform="rotate(20 12 42)" opacity=".8"/>
      </g>

      {/* ── Ornamen sudut kiri bawah ── */}
      <g className="orn2" transform="translate(8,212) scale(1,-1)">
        <path d="M10,10 Q30,5 35,20 Q40,35 25,40 Q10,45 8,30 Q6,15 18,12" fill="none" stroke="#065f46" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18,12 Q32,8 36,22 Q40,36 27,39 Q14,42 12,30 Q10,18 20,15" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="38" cy="14" rx="5" ry="3" fill="#D4AF37" transform="rotate(-30 38 14)" opacity=".8"/>
      </g>

      {/* ── Ornamen sudut kanan bawah ── */}
      <g className="orn1" transform="translate(352,212) scale(-1,-1)">
        <path d="M10,10 Q30,5 35,20 Q40,35 25,40 Q10,45 8,30 Q6,15 18,12" fill="none" stroke="#065f46" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18,12 Q32,8 36,22 Q40,36 27,39 Q14,42 12,30 Q10,18 20,15" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="38" cy="14" rx="5" ry="3" fill="#065f46" transform="rotate(-30 38 14)" opacity=".8"/>
      </g>

      {/* ── Bulan sabit tengah ── */}
      <g className="orn1" transform="translate(180,110)">
        <circle cx="0" cy="0" r="28" fill="#065f46" opacity=".12"/>
        <path d="M-14,-18 Q10,-22 18,-8 Q26,6 14,18 Q2,26 -10,20 Q4,16 8,4 Q12,-8 2,-16 Z" fill="#065f46" opacity=".85"/>
        <circle cx="12" cy="-16" r="4" fill="#D4AF37" opacity=".9"/>
        {/* Bintang di atas bulan */}
        <polygon points="18,-24 19.5,-20 24,-20 20.5,-17.5 22,-13.5 18,-16 14,-13.5 15.5,-17.5 12,-20 16.5,-20" fill="#D4AF37" opacity=".95"/>
      </g>

      {/* ── Teks Bismillah ── */}
      <text x="180" y="56" textAnchor="middle" fontFamily="serif" fontSize="11" fill="#065f46" opacity=".7" letterSpacing="2">
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </text>

      {/* ── Nama mempelai ── */}
      <text className="shimmer" x="180" y="88" textAnchor="middle" fontFamily="Georgia, serif" fontSize="18" fontWeight="bold" fill="#1a1a1a" fontStyle="italic">
        Arinda
      </text>
      <text x="180" y="105" textAnchor="middle" fontFamily="serif" fontSize="13" fill="#D4AF37">&amp;</text>
      <text className="shimmer" x="180" y="122" textAnchor="middle" fontFamily="Georgia, serif" fontSize="18" fontWeight="bold" fill="#1a1a1a" fontStyle="italic">
        Baskara
      </text>

      {/* ── Divider ornamen ── */}
      <line x1="100" y1="132" x2="140" y2="132" stroke="#D4AF37" strokeWidth="0.8" opacity=".7"/>
      <circle cx="180" cy="132" r="3" fill="#D4AF37" opacity=".8"/>
      <line x1="220" y1="132" x2="260" y2="132" stroke="#D4AF37" strokeWidth="0.8" opacity=".7"/>

      {/* ── Tanggal ── */}
      <text x="180" y="150" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#666" letterSpacing="2">
        SABTU · 14 JUNI 2025
      </text>

      {/* ── Tombol ── */}
      <rect x="130" y="160" width="100" height="26" rx="13" fill="#065f46" opacity=".9"/>
      <text x="180" y="177" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#D4AF37" fontWeight="600" letterSpacing="1">
        ✉ Buka Undangan
      </text>
    </svg>
  )
}
