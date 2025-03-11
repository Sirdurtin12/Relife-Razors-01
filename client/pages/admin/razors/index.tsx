import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import AdminLayout from '../../../components/admin/AdminLayout'

const AdminRazorsPage = () => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  
  const [razors, setRazors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedRazors, setSelectedRazors] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const itemsPerPage = 20
  
  // Charger les rasoirs
  useEffect(() => {
    const fetchRazors = async () => {
      try {
        setLoading(true)
        
        let query = supabaseClient
          .from('razors')
          .select(`
            *,
            profiles (
              username,
              email
            )
          `, { count: 'exact' })
        
        // Appliquer la recherche
        if (searchTerm) {
          query = query.or(
            `manufacturer.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,reference.ilike.%${searchTerm}%`
          )
        }
        
        // Appliquer le tri
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
        
        // Appliquer la pagination
        const from = (currentPage - 1) * itemsPerPage
        const to = from + itemsPerPage - 1
        query = query.range(from, to)
        
        const { data, count, error } = await query
        
        if (error) throw error
        
        setRazors(data || [])
        setTotalCount(count || 0)
      } catch (error) {
        console.error('Error fetching razors:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRazors()
  }, [supabaseClient, searchTerm, currentPage, sortBy, sortOrder])
  
  // Gérer la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Réinitialiser la pagination
  }
  
  // Gérer la sélection d'un rasoir
  const handleSelectRazor = (id: string) => {
    setSelectedRazors((prev) => {
      if (prev.includes(id)) {
        return prev.filter((razorId) => razorId !== id)
      } else {
        return [...prev, id]
      }
    })
  }
  
  // Sélectionner tous les rasoirs
  const handleSelectAll = () => {
    if (selectedRazors.length === razors.length) {
      setSelectedRazors([])
    } else {
      setSelectedRazors(razors.map((razor) => razor.id))
    }
  }
  
  // Supprimer les rasoirs sélectionnés
  const handleDeleteSelected = async () => {
    if (selectedRazors.length === 0) return
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedRazors.length} rasoir(s) ?`)) {
      return
    }
    
    try {
      const { error } = await supabaseClient
        .from('razors')
        .delete()
        .in('id', selectedRazors)
      
      if (error) throw error
      
      // Mettre à jour la liste
      setRazors(razors.filter((razor) => !selectedRazors.includes(razor.id)))
      setSelectedRazors([])
      
      alert('Rasoirs supprimés avec succès')
    } catch (error) {
      console.error('Error deleting razors:', error)
      alert('Erreur lors de la suppression des rasoirs')
    }
  }
  
  // Gérer le tri
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }
  
  // Calculer le nombre de pages
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  
  return (
    <>
      <Head>
        <title>Gestion des rasoirs | Admin | Relife Razor</title>
      </Head>
      
      <AdminLayout title="Gestion des rasoirs">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Tous les rasoirs ({totalCount})</h1>
          
          <div className="flex gap-3">
            <Link href="/admin/razors/add" className="btn-primary">
              Ajouter un rasoir
            </Link>
            
            {selectedRazors.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="btn-danger"
              >
                Supprimer ({selectedRazors.length})
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un rasoir..."
              className="input-field flex-grow"
            />
            <button type="submit" className="btn-secondary">
              Rechercher
            </button>
          </form>
        </div>
        
        <div className="bg-white dark:bg-slate-700 rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-slate-600">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRazors.length === razors.length && razors.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-500"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('manufacturer')}
                  >
                    <div className="flex items-center">
                      Fabricant
                      {sortBy === 'manufacturer' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('model')}
                  >
                    <div className="flex items-center">
                      Modèle
                      {sortBy === 'model' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center">
                      Référence
                      {sortBy === 'reference' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('blade_type')}
                  >
                    <div className="flex items-center">
                      Type
                      {sortBy === 'blade_type' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('avg_gentleness')}
                  >
                    <div className="flex items-center">
                      Douceur
                      {sortBy === 'avg_gentleness' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Date d'ajout
                      {sortBy === 'created_at' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-700 divide-y divide-gray-200 dark:divide-gray-600">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : razors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                      Aucun rasoir trouvé
                    </td>
                  </tr>
                ) : (
                  razors.map((razor) => (
                    <tr key={razor.id} className="hover:bg-gray-50 dark:hover:bg-slate-600">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRazors.includes(razor.id)}
                          onChange={() => handleSelectRazor(razor.id)}
                          className="rounded border-gray-300 dark:border-gray-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        {razor.manufacturer}
                      </td>
                      <td className="px-4 py-4">
                        {razor.model}
                      </td>
                      <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                        {razor.reference || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-slate-600">
                          {razor.blade_type}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {razor.avg_gentleness}/20
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(razor.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right space-x-2">
                        <Link 
                          href={`/admin/razors/${razor.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Modifier
                        </Link>
                        <Link 
                          href={`/razors/${razor.id}`}
                          className="text-green-600 dark:text-green-400 hover:underline"
                          target="_blank"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalCount)} sur {totalCount} rasoirs
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                &lsaquo;
              </button>
              
              <span className="px-3 py-1">
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  )
}

export default AdminRazorsPage
