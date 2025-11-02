'use client'

import { useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'

export default function PingButton() {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    setStatus(null)
    try {
      const res = await axios.get('/api/backend/ping-protected')
      setStatus(`${res.status} ${res.statusText}: ${JSON.stringify(res.data)}`)
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setStatus(`Error: ${e.message}`)
      } else {
        const err = e as { message?: string }
        setStatus(`Error: ${err?.message ?? 'unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 space-y-2">
      <Button onClick={onClick} disabled={loading} variant="outline" className="!bg-secondary-button-bg !text-secondary-button-text !border-secondary-button-border hover:!bg-secondary-button-hover-bg hover:!text-secondary-button-hover-text transition-colors font-sans">
        {loading ? 'Pinging…' : 'Ping Protected Backend'}
      </Button>
      {status && (
        <div className="text-xs text-brand-primary break-all text-left max-w-prose mx-auto font-sans">{status}</div>
      )}
    </div>
  )
}


