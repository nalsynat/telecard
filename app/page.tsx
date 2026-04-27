
'use client'

import { useState } from 'react'

export default function Home() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [fullName, setFullName] = useState('Sokha Chann')
  const [jobTitle, setJobTitle] = useState('CEO & Co-Founder')
  const [username, setUsername] = useState('sokha')
  const [loading, setLoading] = useState(false)
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!photo) {
      setError('Please select a photo first.')
      return
    }
    setLoading(true)
    setError(null)
    setWallpaperUrl(null)

    try {
      const formData = new FormData()
      formData.append('photo', photo, photo.name)
      formData.append('fullName', fullName)
      formData.append('jobTitle', jobTitle)
      formData.append('username', username)

      const res = await fetch('/api/wallpaper', {
        method: 'POST',
        body: formData,
      })

      const contentType = res.headers.get('content-type')

      if (!res.ok || !contentType?.includes('image')) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(err.detail || err.error || 'Failed to generate wallpaper.')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setWallpaperUrl(url)
    } catch (e: any) {
      setError('Network error: ' + (e?.message || 'unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#002D62]">TeleCard</h1>
          <p className="text-sm text-gray-500 mt-1">Smart Wallpaper Generator</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002D62]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title / Tagline</label>
            <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002D62]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002D62]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Photo</label>
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#002D62] file:text-white hover:file:bg-blue-900" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={handleGenerate} disabled={loading}
            className="w-full bg-[#002D62] text-white font-semibold py-3 rounded-lg hover:bg-blue-900 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Generating...' : 'Generate Smart Wallpaper'}
          </button>
        </div>
        {wallpaperUrl && (
          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-gray-700 mb-3">Your Smart Wallpaper is ready:</p>
            <img src={wallpaperUrl} alt="Generated wallpaper" className="w-full rounded-xl shadow-md mb-4" />
            <a href={wallpaperUrl} download="telecard-wallpaper.jpg"
              className="inline-block bg-[#7B001C] text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-900 transition">
              Download Wallpaper
            </a>
          </div>
        )}
      </div>
    </main>
  )
}