// app/onboarding/OnboardingForm.tsx
'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/'

  const [name, setName] = React.useState('')
  const [goal, setGoal] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || undefined, goal: goal.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Failed with ${res.status}`)
      }
      // Success → go to intended page (middleware will allow it now)
      router.replace(nextPath)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome! Let’s set things up</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Your name (optional)</label>
          <input
            className="w-full rounded-md border p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Rubén"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Main goal (optional)</label>
          <input
            className="w-full rounded-md border p-2"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Lose fat, gain strength…"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-lg border px-4 py-2 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save & Continue'}
        </button>
      </form>
    </div>
  )
}
