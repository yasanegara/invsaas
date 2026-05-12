import type { InvitationContent } from './types'

export default function ElegantGoldTemplate({ inv }: { inv: InvitationContent }) {
  const primary = inv.primaryColor ?? '#b8963e'
  const dark = inv.secondaryColor ?? '#3a2e1a'

  return (
    <div style={{ background: '#fdf8f0', fontFamily: 'Georgia, serif', color: dark, minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: dark, padding: '48px 24px 36px', textAlign: 'center' }}>
        <p style={{ color: primary, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          Wedding Invitation
        </p>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 400, lineHeight: 1.3 }}>
          {inv.names[0]}
          <span style={{ color: primary, fontSize: 40, display: 'block', margin: '4px 0' }}>&</span>
          {inv.names[1]}
        </h1>
        <p style={{ color: primary, fontSize: 13, letterSpacing: 1, marginTop: 12 }}>
          {inv.eventDate}
        </p>
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${primary}, transparent)`, marginTop: 24 }} />
      </div>

      {/* Opening */}
      <div style={{ padding: '28px 24px 0' }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: primary, textTransform: 'uppercase', marginBottom: 8 }}>
          Bismillah
        </p>
        <p style={{ fontSize: 13, color: '#6b5a3a', lineHeight: 1.8 }}>
          {inv.openingMessage}
        </p>
      </div>

      {/* Ornament */}
      <p style={{ color: primary, fontSize: 20, textAlign: 'center', margin: '20px 0 4px' }}>✦ ✦ ✦</p>
      <Divider color={primary} />

      {/* Tanggal */}
      <InfoRow icon="calendar" primary={primary} dark={dark}>
        <strong style={{ fontSize: 14 }}>{inv.eventDate}</strong>
        <br />
        <span style={{ fontSize: 12, color: primary }}>
          {inv.akadTime && `Akad: ${inv.akadTime}`}
          {inv.akadTime && inv.resepsiTime && ' · '}
          {inv.resepsiTime && `Resepsi: ${inv.resepsiTime}`}
        </span>
      </InfoRow>

      <Divider color={primary} />

      {/* Lokasi */}
      <InfoRow icon="map" primary={primary} dark={dark}>
        <strong style={{ fontSize: 14 }}>{inv.venue}</strong>
        {inv.venueAddress && (
          <>
            <br />
            <span style={{ fontSize: 12, color: primary }}>{inv.venueAddress}</span>
          </>
        )}
        {inv.mapsUrl && (
          <>
            <br />
            <a href={inv.mapsUrl} style={{ fontSize: 12, color: primary }}>Lihat di Maps →</a>
          </>
        )}
      </InfoRow>

      <Divider color={primary} />

      {/* Gallery placeholder (ganti dengan gambar nyata) */}
      {inv.galleryImages && inv.galleryImages.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, margin: '20px 24px' }}>
          {inv.galleryImages.slice(0, 4).map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 2 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, margin: '20px 24px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: 90, background: '#e8d9bb', borderRadius: 2 }} />
          ))}
        </div>
      )}

      {/* RSVP */}
      <RSVPBlock inv={inv} buttonBg={dark} buttonColor={primary} rounded={2} />

      {/* Footer */}
      {inv.hashtag && (
        <p style={{ textAlign: 'center', padding: '16px 24px', fontSize: 11, color: primary, letterSpacing: 1 }}>
          #{inv.hashtag}
        </p>
      )}
    </div>
  )
}

function Divider({ color }: { color: string }) {
  return <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${color}55, transparent)`, margin: '0 24px' }} />
}

function InfoRow({ icon, primary, dark, children }: { icon: string; primary: string; dark: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 24px' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon === 'calendar' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        )}
      </div>
      <div style={{ fontSize: 13, color: dark, lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function RSVPBlock({ inv, buttonBg, buttonColor, rounded }: {
  inv: InvitationContent
  buttonBg: string
  buttonColor: string
  rounded: number
}) {
  const href = inv.rsvpFormUrl ?? (inv.rsvpWhatsapp ? `https://wa.me/${inv.rsvpWhatsapp}` : '#')
  return (
    <a
      href={href}
      style={{
        display: 'block',
        margin: '20px 24px',
        padding: '14px',
        background: buttonBg,
        color: buttonColor,
        textAlign: 'center',
        borderRadius: rounded,
        fontSize: 13,
        letterSpacing: 2,
        textTransform: 'uppercase',
        textDecoration: 'none',
      }}
    >
      Konfirmasi Kehadiran
    </a>
  )
}
