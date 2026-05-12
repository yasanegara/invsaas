import type { InvitationContent } from './types'

// ─── MODERN CLEAN ────────────────────────────────────────────

export function ModernCleanTemplate({ inv }: { inv: InvitationContent }) {
  return (
    <div style={{ background: '#f7f7f5', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', color: '#1a1a1a', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: '#1a1a1a', padding: '52px 24px 40px' }}>
        <div style={{ display: 'inline-block', background: '#fff', color: '#1a1a1a', fontSize: 10, letterSpacing: 2, padding: '4px 10px', marginBottom: 20 }}>
          WEDDING
        </div>
        <h1 style={{ color: '#fff', fontSize: 34, fontWeight: 300, letterSpacing: -0.5, lineHeight: 1.2 }}>
          {inv.names[0]}<br />{inv.names[1]}
        </h1>
        <p style={{ color: '#888', fontSize: 12, marginTop: 12, letterSpacing: 1 }}>
          {inv.eventDate} · {inv.venue}
        </p>
      </div>

      {/* Opening */}
      <div style={{ padding: '28px 24px 0' }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: '#999', textTransform: 'uppercase', marginBottom: 10 }}>
          The Ceremony
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 300, marginBottom: 8 }}>You are invited</h2>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>{inv.openingMessage}</p>
      </div>

      {/* Detail card */}
      <div style={{ background: '#fff', borderRadius: 8, margin: '16px 24px 0', border: '1px solid #eee', overflow: 'hidden' }}>
        {[
          { label: 'Tanggal', value: inv.eventDate },
          { label: 'Akad', value: inv.akadTime ?? '-' },
          { label: 'Resepsi', value: inv.resepsiTime ?? '-' },
          { label: 'Venue', value: inv.venue },
        ].map(({ label, value }, i, arr) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none', fontSize: 13 }}>
            <span style={{ color: '#999', fontSize: 12 }}>{label}</span>
            <span style={{ fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Maps */}
      {inv.mapsUrl ? (
        <a href={inv.mapsUrl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, background: '#e8e8e5', margin: '12px 24px 0', borderRadius: 8, fontSize: 13, color: '#555', textDecoration: 'none', gap: 6 }}>
          <span>📍</span> Lihat Lokasi di Maps
        </a>
      ) : (
        <div style={{ height: 100, background: '#e8e8e5', margin: '12px 24px 0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#999' }}>
          📍 {inv.venueAddress ?? inv.venue}
        </div>
      )}

      {/* RSVP */}
      <a href={inv.rsvpFormUrl ?? (inv.rsvpWhatsapp ? `https://wa.me/${inv.rsvpWhatsapp}` : '#')}
        style={{ display: 'block', margin: '20px 24px', padding: 14, background: '#1a1a1a', color: '#fff', textAlign: 'center', borderRadius: 4, fontSize: 13, textDecoration: 'none' }}>
        RSVP Sekarang
      </a>

      {/* Footer */}
      <p style={{ padding: '0 24px 24px', fontSize: 11, color: '#aaa', textAlign: 'center' }}>
        {inv.hashtag && `#${inv.hashtag} · `}Made with Invitia
      </p>
    </div>
  )
}

// ─── ROMANTIC PINK ───────────────────────────────────────────

export function RomanticPinkTemplate({ inv }: { inv: InvitationContent }) {
  const primary = inv.primaryColor ?? '#c05a8a'

  return (
    <div style={{ background: '#fff5f8', fontFamily: 'Georgia, serif', color: '#4a2030', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: primary, padding: '48px 24px 32px', textAlign: 'center' }}>
        <p style={{ color: '#ffd6e8', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          {inv.tagline ?? "We're Getting Married"}
        </p>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 400, lineHeight: 1.4 }}>
          {inv.names[0]}<br />& {inv.names[1]}
        </h1>
        <p style={{ color: '#ffd6e8', fontSize: 24, margin: '10px 0' }}>♥</p>
        <p style={{ color: '#ffd6e8', fontSize: 12 }}>{inv.eventDate}</p>
      </div>

      {/* Opening */}
      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: primary, textTransform: 'uppercase', marginBottom: 8 }}>With Love</p>
        <p style={{ fontSize: 13, color: '#7a4050', lineHeight: 1.8 }}>{inv.openingMessage}</p>
      </div>

      {/* Quote */}
      {inv.quote && (
        <div style={{ background: '#fff', margin: '16px 24px 0', padding: '16px', borderRadius: 12, borderLeft: `3px solid ${primary}`, fontSize: 13, color: '#7a4050', lineHeight: 1.7, fontStyle: 'italic' }}>
          "{inv.quote}"
        </div>
      )}

      {/* Detail grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 24px 0' }}>
        {[
          { icon: '📅', val: inv.eventDay ?? inv.eventDate, sub: 'Tanggal' },
          { icon: '🕐', val: inv.resepsiTime ?? inv.akadTime ?? '—', sub: 'Waktu' },
          { icon: '📍', val: inv.venue, sub: 'Lokasi' },
          { icon: '💌', val: inv.rsvpDeadline ? `s/d ${inv.rsvpDeadline}` : 'RSVP', sub: 'Konfirmasi' },
        ].map(({ icon, val, sub }) => (
          <div key={sub} style={{ background: '#fff', borderRadius: 12, padding: '16px', textAlign: 'center', border: '1px solid #f0c0d0' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#4a2030' }}>{val}</div>
            <div style={{ fontSize: 11, color: primary, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* RSVP */}
      <a href={inv.rsvpFormUrl ?? (inv.rsvpWhatsapp ? `https://wa.me/${inv.rsvpWhatsapp}` : '#')}
        style={{ display: 'block', margin: '20px 24px', padding: 14, background: primary, color: '#fff', textAlign: 'center', borderRadius: 24, fontSize: 13, textDecoration: 'none' }}>
        Konfirmasi Kehadiran ♥
      </a>

      {inv.hashtag && (
        <p style={{ textAlign: 'center', padding: '0 0 20px', fontSize: 11, color: primary }}>
          #{inv.hashtag}
        </p>
      )}
    </div>
  )
}

// ─── BIRTHDAY BASH ───────────────────────────────────────────

export function BirthdayTemplate({ inv }: { inv: InvitationContent }) {
  const primary = inv.primaryColor ?? '#5b4fcf'
  const light = '#f0edff'

  return (
    <div style={{ background: light, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', color: '#1e1060', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: primary, padding: '40px 24px 28px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#fff', color: primary, fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 16, letterSpacing: 1 }}>
          BIRTHDAY PARTY
        </div>
        <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>
          {inv.names[0]} {inv.tagline ?? ''}
        </h1>
        <p style={{ color: '#c5beff', fontSize: 13, marginTop: 8 }}>Join us for a celebration!</p>
      </div>

      {/* Confetti row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px', fontSize: 20 }}>
        🎉 🎂 🎈 🎁 🥳
      </div>

      {/* Opening */}
      <div style={{ padding: '0 24px' }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: primary, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
          Hey there!
        </p>
        <p style={{ fontSize: 13, color: '#5548a0', lineHeight: 1.7 }}>{inv.openingMessage}</p>
      </div>

      {/* Info chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 24px 0' }}>
        {[
          { icon: '📅', text: inv.eventDate, sub: inv.resepsiTime ?? inv.akadTime ?? '' },
          { icon: '📍', text: inv.venue, sub: inv.venueAddress ?? '' },
          ...(inv.dressCode ? [{ icon: '👗', text: `Dress Code: ${inv.dressCode}`, sub: "Come fab!" }] : []),
        ].map(({ icon, text, sub }) => (
          <div key={text} style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #ddd8ff' }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1e1060' }}>{text}</div>
              {sub && <div style={{ fontSize: 11, color: '#7b6fd6' }}>{sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* RSVP */}
      <a href={inv.rsvpFormUrl ?? (inv.rsvpWhatsapp ? `https://wa.me/${inv.rsvpWhatsapp}` : '#')}
        style={{ display: 'block', margin: '20px 24px', padding: 14, background: primary, color: '#fff', textAlign: 'center', borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
        I'm Coming! 🎉
      </a>

      {inv.hashtag && (
        <p style={{ textAlign: 'center', padding: '0 0 20px', fontSize: 11, color: '#7b6fd6' }}>
          #{inv.hashtag} · Made with Invitia
        </p>
      )}
    </div>
  )
}
