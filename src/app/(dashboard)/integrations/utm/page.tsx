"use client"

import { useState, useEffect } from "react"
import { Copy, Trash, Link2 } from "lucide-react"

interface UtmLinkItem {
  id: string
  name?: string | null
  destinationUrl: string
  fullUrl: string
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  clicks: number
  createdAt: string
}

export default function UTMPage() {
  const [links, setLinks] = useState<UtmLinkItem[]>([])
  const [formData, setFormData] = useState({
    url: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    adAccountId: "",
    campaignId: "",
    adSetId: "",
    adId: ""
  })
  const [generatedUrl, setGeneratedUrl] = useState("")

  const fetchLinks = async () => {
    const res = await fetch("/api/utm/links")
    if (res.ok) {
      const data = await res.json()
      setLinks(data.links || [])
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const handleGenerate = async () => {
    if (!formData.url) {
      alert("Por favor, informe a URL de destino")
      return
    }
    const res = await fetch("/api/utm/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (data.link) {
      setGeneratedUrl(data.link.fullUrl)
      fetchLinks()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este link?")) return
    await fetch(`/api/utm/links?id=${id}`, { method: "DELETE" })
    fetchLinks()
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("URL copiada para a área de transferência!")
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerador de Links UTM</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crie URLs rastreáveis com parâmetros UTM e identificadores de anúncios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de Destino *</label>
            <input 
              type="text" 
              placeholder="https://seusite.com/produto" 
              value={formData.url} 
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">utm_source</label>
              <input 
                type="text" 
                placeholder="Ex: meta, facebook, instagram" 
                value={formData.utm_source} 
                onChange={e => setFormData({ ...formData, utm_source: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">utm_medium</label>
              <input 
                type="text" 
                placeholder="Ex: cpc, story, feed, banner" 
                value={formData.utm_medium} 
                onChange={e => setFormData({ ...formData, utm_medium: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">utm_campaign</label>
              <input 
                type="text" 
                placeholder="Ex: lancamento_outubro" 
                value={formData.utm_campaign} 
                onChange={e => setFormData({ ...formData, utm_campaign: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">utm_content</label>
              <input 
                type="text" 
                placeholder="Ex: video_1, carrossel_azul" 
                value={formData.utm_content} 
                onChange={e => setFormData({ ...formData, utm_content: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">utm_term</label>
            <input 
              type="text" 
              placeholder="Ex: publico_lookalike" 
              value={formData.utm_term} 
              onChange={e => setFormData({ ...formData, utm_term: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <button 
            onClick={handleGenerate} 
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Link2 className="w-4 h-4" /> Gerar Link Rastreável
          </button>

          {generatedUrl && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
              <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1 uppercase tracking-wider">URL Gerada:</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={generatedUrl} 
                  className="w-full px-3 py-2 rounded border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 text-xs font-mono"
                />
                <button 
                  onClick={() => handleCopy(generatedUrl)} 
                  className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-fit overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Links Gerados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-left">
                  <th className="py-2.5 px-3">Campanha</th>
                  <th className="py-2.5 px-3">URL</th>
                  <th className="text-right py-2.5 px-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{link.utmCampaign || 'Geral'}</td>
                    <td className="py-2.5 px-3 truncate max-w-[120px] text-gray-500" title={link.fullUrl}>{link.fullUrl}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleCopy(link.fullUrl)} className="p-1 text-blue-600 hover:text-blue-700" title="Copiar"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(link.id)} className="p-1 text-red-600 hover:text-red-700" title="Excluir"><Trash className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {links.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-400">Nenhum link gerado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
