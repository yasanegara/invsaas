import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const invitations = await prisma.invitation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  const published = invitations.filter(i => i.status === 'published').length
  const totalViews = invitations.reduce((sum, i) => sum + i.viewCount, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5' }}>

      {/* Navbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Invitia</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#888' }}>{session.user.email}</span>
          <Link href="/api/auth/signout" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Keluar</Link>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 2 }}>Undangan Saya</h1>
            <p style={{ fontSize: 14, color: '#888' }}>Kelola semua undangan digitalmu</p>
          </div>
          <Link
            href="/dashboard/new"
            style={{ background: '#1a1a1a', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}
          >
            + Buat Baru
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Undangan', value: invitations.length, color: '#1a1a1a' },
            { label: 'Published', value: published, color: '#166534' },
            { label: 'Draft', value: invitations.length - published, color: '#92400e' },
            { label: 'Total Views', value: totalViews, color: '#1d4ed8' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #eee', padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {invitations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Belum ada undangan</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Buat undangan pertama Anda sekarang</p>
            <Link
              href="/dashboard/new"
              style={{ background: '#1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, textDecoration: 'none' }}
            >
              Buat Undangan
            </Link>
          </div>
        )}

        {/* Invitation list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {invitations.map((inv: any) => (
            <div key={inv.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{inv.title}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#aaa' }}>
                  <span>{inv.templateId}</span>
                  <span>·</span>
                  <span>{inv.status === 'published' ? '🟢 Published' : '⚪ Draft'}</span>
                  <span>·</span>
                  <span>{inv.viewCount} views</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {inv.status === 'published' && (
                  <Link
                    href={`/i/${inv.slug}`}
                    target="_blank"
                    style={{ fontSize: 13, padding: '6px 12px', borderRadius: 6, border: '1px solid #eee', textDecoration: 'none', color: '#555' }}
                  >
                    Lihat
                  </Link>
                )}
                <Link
                  href={`/dashboard/edit/${inv.id}`}
                  style={{ fontSize: 13, padding: '6px 12px', borderRadius: 6, border: '1px solid #1a1a1a', textDecoration: 'none', color: '#1a1a1a', fontWeight: 500 }}
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
