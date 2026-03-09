'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Asset {
  id: string
  name: string
  asset_type: string
  registrar: string
  expiration_date: string
  renewal_cost: number
  auto_renewal: boolean
  notes: string
}

export default function EditAssetModal({ asset, onClose, onUpdate }: { asset: Asset, onClose: () => void, onUpdate: () => void }) {
  const [formData, setFormData] = useState(asset)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('assets')
        .update(formData)
        .eq('id', asset.id)

      if (error) throw error
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Update error:', error)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Edit Asset</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Asset name" className="w-full border p-2 rounded" required />
          <input type="text" name="asset_type" value={formData.asset_type} onChange={handleChange} placeholder="Type (domain, SSL, license)" className="w-full border p-2 rounded" required />
          <input type="text" name="registrar" value={formData.registrar} onChange={handleChange} placeholder="Registrar/Provider" className="w-full border p-2 rounded" />
          <input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleChange} className="w-full border p-2 rounded" required />
          <input type="number" name="renewal_cost" value={formData.renewal_cost} onChange={handleChange} placeholder="Renewal cost" step="0.01" className="w-full border p-2 rounded" />
          <label className="flex items-center">
            <input type="checkbox" name="auto_renewal" checked={formData.auto_renewal} onChange={handleChange} className="mr-2" />
            Auto-renewal enabled
          </label>
          <textarea name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Notes" className="w-full border p-2 rounded" />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 p-2 rounded hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
