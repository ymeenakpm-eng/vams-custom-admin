"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      router.push("/products")
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.message || "Invalid credentials")
    }
  }

  return (
    <main className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm bg-white border rounded-lg shadow-sm p-5">
        <h1 className="text-lg font-semibold mb-4">Log in</h1>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <label className="block">
            <div className="text-sm mb-1">Email</div>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Password</div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-md text-sm mt-1">Log in</button>
        </form>
      </div>
    </main>
  )
}