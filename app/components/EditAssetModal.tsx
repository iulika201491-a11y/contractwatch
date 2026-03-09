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
  notes?: string
  client_id: string
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
        .update({
          name: formData.name,
          asset_type: formData.asset_type,
          registrar: formData.registrar,
          expiration_date: formData.expiration_date,
          renewal_cost: parseFloat(formData.renewal_cost.toString()),
          auto_renewal: formData.auto_renewal,
          notes: formData.notes
        })
        .eq('id', asset.id)

      if (error) throw error
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Update error:', error)
      alert('Error updating asset')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Asset</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Asset name" 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-600" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select 
              name="asset_type" 
              value={formData.asset_type} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-600" 
              required
            >
              <option value="domain">Domain</option>
              <option value="ssl">SSL Certificate</option>
              <option value="hosting">Hosting</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registrar</label>
            <input 
              type="text" 
              name="registrar" 
              value={formData.registrar} 
              onChange={handleChange} 
              placeholder="Registrar/Provider" 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-600" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
            <input 
              type="date" 
              name="expiration_date" 
              value={formData.expiration_date} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-600" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Renewal Cost ($)</label>
            <input 
              type="number" 
              name="renewal_cost" 
              value={formData.renewal_cost} 
              onChange={handleChange} 
              placeholder="Renewal cost" 
              step="0.01" 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-600" 
            />
          </div>

          <div>
            <label className="flex items-center">
              <input 
                type="checkbox" 
                name="auto_renewal" 
                checked={formData.auto_renewal} 
                onChange={handleChange} 
                className="mr-2 rounded" 
              />
              <span className="text-sm font-medium text-gray-700">Auto-renewal enabled</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea 
              name="notes" 
              value={formData.notes || ''} 
              onChange={handleChange} 
              placeholder="Notes" 
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-600" 
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-gray-300 text-gray-900 p-2 rounded hover:bg-gray-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
