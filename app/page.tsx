export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <main className="max-w-5xl px-4 py-6">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <h1 className="text-lg font-semibold">Welcome to VAMS Admin</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your catalog, orders, customers and more.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/products" className="block bg-white border rounded-lg p-4 shadow-sm hover:shadow cursor-pointer">
          <div className="text-base font-medium">Products</div>
          <div className="text-sm text-gray-600">Browse, create, and edit products</div>
        </a>
        <a href="/categories" className="block bg-white border rounded-lg p-4 shadow-sm hover:shadow cursor-pointer">
          <div className="text-base font-medium">Categories</div>
          <div className="text-sm text-gray-600">Organize products by category</div>
        </a>
        <a href="/orders" className="block bg-white border rounded-lg p-4 shadow-sm hover:shadow cursor-pointer">
          <div className="text-base font-medium">Orders</div>
          <div className="text-sm text-gray-600">View and manage orders</div>
        </a>
        <a href="/customers" className="block bg-white border rounded-lg p-4 shadow-sm hover:shadow cursor-pointer">
          <div className="text-base font-medium">Customers</div>
          <div className="text-sm text-gray-600">Customer profiles and history</div>
        </a>
        <a href="/sales" className="block bg-white border rounded-lg p-4 shadow-sm hover:shadow cursor-pointer">
          <div className="text-base font-medium">Sales</div>
          <div className="text-sm text-gray-600">Reports and insights</div>
        </a>
        <a href="/profile" className="block bg-white border rounded-lg p-4 shadow-sm hover:shadow cursor-pointer">
          <div className="text-base font-medium">Profile</div>
          <div className="text-sm text-gray-600">Your account details</div>
        </a>
      </div>
    </main>
  )
}
