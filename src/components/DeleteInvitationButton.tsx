'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteInvitationButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/invitations/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirm) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#e53e3e', whiteSpace: 'nowrap' }}>Yakin hapus?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{
            fontSize: 12, padding: '5px 10px', borderRadius: 6,
            border: 'none', background: '#e53e3e', color: '#fff',
            cursor: loading ? 'default' : 'pointer', fontWeight: 500,
          }}
        >
          {loading ? '...' : 'Ya, hapus'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          disabled={loading}
          style={{
            fontSize: 12, padding: '5px 10px', borderRadius: 6,
            border: '1px solid #e0e0e0', background: '#fff', color: '#555',
            cursor: 'pointer',
          }}
        >
          Batal
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      style={{
        fontSize: 13, padding: '6px 12px', borderRadius: 6,
        border: '1px solid #fca5a5', background: '#fff', color: '#e53e3e',
        cursor: 'pointer',
      }}
    >
      Hapus
    </button>
  )
}
