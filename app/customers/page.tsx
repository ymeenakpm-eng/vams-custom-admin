export const dynamic = "force-dynamic"
export const revalidate = 0

export default function CustomersPage() {
  return (
    <main className="max-w-5xl">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-semibold">Customers</h1>
        </div>
        <p className="text-sm text-gray-600">Coming soon: customer list, details, addresses, order history, and search.</p>
      </div>
      <div className="bg-white border rounded-lg p-6 text-sm text-gray-600">No customers to show yet.</div>
    </main>
  )
}
