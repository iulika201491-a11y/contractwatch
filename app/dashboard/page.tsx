'use client'
import EditAssetModal from '@/app/components/EditAssetModal'


import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface Asset {
  id: string
  name: string
  asset_type: string
  expiration_date: string
  renewal_cost: number
  auto_renewal: boolean
  client_id: string
  registrar: string
  notes?: string
}

interface Client {
  id: string
  name: string
  assets?: Asset[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  const [loading, setLoading] = useState(true)
  const [showNewAsset, setShowNewAsset] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [newClientName, setNewClientName] = useState('')
  const router = useRouter()

  // Get current user and load data
  useEffect(() => {
  const getSession = async () => {
    // First check localStorage for existing session
    const storedSession = localStorage.getItem('contractwatch-auth')
    
    const { data } = await supabase.auth.getSession()
    
    if (!data.session && !storedSession) {
      router.push('/auth')
      return
    }
    
    if (data.session) {
      setUser(data.session.user)
      fetchClients(data.session.user.id)
    }
  }
  getSession()
}, [router])


  const fetchClients = async (userId: string) => {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        assets (
          id,
          name,
          asset_type,
          expiration_date,
          renewal_cost,
          auto_renewal,
          registrar,
          notes
        )
      `)
      .eq('user_id', userId)
      .order('name')

    if (error) {
      console.error('Error fetching clients:', error)
      alert('Error loading data')
    } else {
      setClients(data as Client[] || [])

    }
    setLoading(false)
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    const { error } = await supabase.from('clients').insert({
      user_id: user.id,
      name: newClientName,
    })

    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setNewClientName('')
      setShowNewClient(false)
      fetchClients(user.id)
    }
  }

  const handleAddAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedClient) {
      alert('Please select a client')
      return
    }

    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from('assets').insert({
      client_id: selectedClient,
      name: formData.get('name'),
      asset_type: formData.get('asset_type'),
      registrar: formData.get('registrar'),
      expiration_date: formData.get('expiration_date'),
      renewal_cost: parseFloat((formData.get('renewal_cost') as string) || '0'),
      auto_renewal: formData.get('auto_renewal') === 'on',
      notes: formData.get('notes'),
    })

    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setShowNewAsset(false)
      setSelectedClient('')
      if (user) fetchClients(user.id)
      e.currentTarget.reset()
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const daysUntilExpiration = (expDate: string) => {
    const exp = new Date(expDate)
    const today = new Date()
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'border-l-4 border-red-500 bg-red-50'
    if (days <= 30) return 'border-l-4 border-yellow-500 bg-yellow-50'
    if (days <= 90) return 'border-l-4 border-blue-500 bg-blue-50'
    return 'border-l-4 border-green-500 bg-green-50'
  }

  const getUrgencyBadge = (days: number) => {
    if (days <= 7) return 'bg-red-100 text-red-800'
    if (days <= 30) return 'bg-yellow-100 text-yellow-800'
    if (days <= 90) return 'bg-blue-100 text-blue-800'
    return 'bg-green-100 text-green-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ContractWatch</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowNewClient(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            + Add Client
          </button>
          <button
            onClick={() => setShowNewAsset(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Asset
          </button>
        </div>

        {/* Add Client Modal */}
        {showNewClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-4">Add New Client</h3>
              <form onSubmit={handleAddClient}>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Client name (e.g., Acme Corp)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-blue-600"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                  >
                    Add Client
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewClient(false)
                      setNewClientName('')
                    }}
                    className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Asset Modal */}
        {showNewAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4">Add New Asset</h3>
              <form onSubmit={handleAddAsset}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client *
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select name="asset_type" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600" required>
                    <option value="">Select type</option>
                    <option value="domain">Domain</option>
                    <option value="ssl">SSL Certificate</option>
                    <option value="hosting">Hosting</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registrar
                  </label>
                  <input
                    type="text"
                    name="registrar"
                    placeholder="GoDaddy, Namecheap, etc"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    name="expiration_date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Renewal Cost ($)
                  </label>
                  <input
                    type="number"
                    name="renewal_cost"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Any additional notes"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="mb-6 flex items-center">
                  <input
                    type="checkbox"
                    name="auto_renewal"
                    className="rounded mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Auto-renewal enabled
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Add Asset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAsset(false)
                      setSelectedClient('')
                    }}
                    className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assets Display */}
        <div className="grid gap-6">
          {clients.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No clients yet</p>
              <p className="text-gray-400 mb-6">
                Click "Add Client" to get started
              </p>
              <button
                onClick={() => setShowNewClient(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Add Your First Client
              </button>
            </div>
          ) : (
            clients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-blue-600 text-white px-6 py-4">
                  <h3 className="text-xl font-semibold">{client.name}</h3>
                </div>

                <div className="p-6">
                  {client.assets && client.assets.length > 0 ? (
                    <div className="grid gap-3">
                      {client.assets
                        .sort(
                          (a, b) =>
                            daysUntilExpiration(a.expiration_date) -
                            daysUntilExpiration(b.expiration_date)
                        )
                        .map((asset) => {
                          const days = daysUntilExpiration(
                            asset.expiration_date
                          )
                          return (
                            <div
                              key={asset.id}
                              className={`p-4 rounded ${getUrgencyColor(
                                days
                              )}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-lg">
                                    {asset.name}
                                  </h4>
                                  <p className="text-sm opacity-75">
                                    {asset.asset_type} •{' '}
                                    {asset.registrar || 'Unknown'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${getUrgencyBadge(
                                      days
                                    )}`}
                                  >
                                    {days} days
                                  </span>
                                  <button
                                    onClick={() => setEditingAsset(asset)}
                                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 font-medium"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="opacity-75">Expires</p>
                                  <p className="font-semibold">
                                    {new Date(
                                      asset.expiration_date
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="opacity-75">Renewal Cost</p>
                                  <p className="font-semibold">
                                    $
                                    {asset.renewal_cost?.toFixed(2) || 'N/A'}
                                  </p>
                                </div>
                              </div>

                              {asset.auto_renewal && (
                                <p className="mt-2 text-xs font-semibold">
                                  ✓ Auto-renewal enabled
                                </p>
                              )}

                              {asset.notes && (
                                <p className="mt-2 text-xs opacity-75">
                                  📝 {asset.notes}
                                </p>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No assets for this client yet
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Asset Modal */}
      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onUpdate={() => {
            setEditingAsset(null)
            if (user) fetchClients(user.id)
          }}
        />
      )}
    </div>
  )
}
