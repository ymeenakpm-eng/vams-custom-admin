import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const name = cookieStore.get("admin_name")?.value || "Admin"
  const email = cookieStore.get("admin_email")?.value || ""

  return (
    <main className="max-w-5xl px-4 py-6">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-sm text-gray-600 mt-1">Your account details</p>
      </div>

      <div className="bg-white border rounded-lg p-5 shadow-sm max-w-md">
        <div className="grid gap-3">
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Name</div>
            <input value={name} readOnly className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50" />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Email</div>
            <input value={email} readOnly className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50" />
          </label>
          <form method="POST" action="/api/auth/logout" className="mt-2">
            <button className="border border-red-300 text-red-600 px-3 py-2 rounded-md text-sm hover:bg-red-50">Sign out</button>
          </form>
        </div>
      </div>
    </main>
  )
}
