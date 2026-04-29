import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { generateBrandedQR } from '@/lib/qr'

const W = 1080, H = 2340, HEADER_H = 351, PHOTO_H = 1404
const PB = { r: 0, g: 45, b: 98 }

function headerSVG(): Buffer {
  return Buffer.from('<svg width="1080" height="351" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="351" fill="#002D62"/><text x="540" y="175" font-family="Arial" font-size="80" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle" letter-spacing="8">TeleCard</text></svg>')
}

function actionSVG(name: string, title: string): Buffer {
  const n = name.replace(/&/g, 'and').replace(/[<>]/g, '')
  const t = title.toUpperCase().replace(/&/g, 'AND').replace(/[<>]/g, '')
  return Buffer.from('<svg width="1080" height="585" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="585" fill="#002D62"/><text x="540" y="100" font-family="Arial" font-size="64" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">' + n + '</text><text x="540" y="180" font-family="Arial" font-size="32" fill="#7B001C" text-anchor="middle" dominant-baseline="middle" letter-spacing="6">' + t + '</text><rect x="390" y="220" width="300" height="300" rx="16" fill="white"/></svg>')
}

function gradientSVG(): Buffer {
  return Buffer.from('<svg width="1080" height="520" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#002D62" stop-opacity="0"/><stop offset="55%" stop-color="#002D62" stop-opacity="0.4"/><stop offset="100%" stop-color="#002D62" stop-opacity="0.97"/></linearGradient></defs><rect width="1080" height="520" fill="url(#g)"/></svg>')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const photoFile = formData.get('photo') as File
    const fullName = (formData.get('fullName') as string) || 'Your Name'
    const jobTitle = (formData.get('jobTitle') as string) || 'YOUR TITLE'
    const username = (formData.get('username') as string) || 'username'
    if (!photoFile) return NextResponse.json({ error: 'Photo is required' }, { status: 400 })
    const photoBuffer = Buffer.from(new Uint8Array(await photoFile.arrayBuffer()))
    const profileUrl = 'https://telenamecard.vercel.app/' + username
    const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + fullName + '\nTITLE:' + jobTitle + '\nURL:' + profileUrl + '\nEND:VCARD'
    const [photo, qr, header, action, gradient] = await Promise.all([
      sharp(photoBuffer).rotate().flatten({ background: PB }).resize(W, PHOTO_H, { fit: 'cover', position: 'centre' }).jpeg({ quality: 95 }).toBuffer(),
      generateBrandedQR(vcard, 300),
      sharp(headerSVG()).png().toBuffer(),
      sharp(actionSVG(fullName, jobTitle)).png().toBuffer(),
      sharp(gradientSVG()).png().toBuffer(),
    ])
    const wallpaper = await sharp({ create: { width: W, height: H, channels: 3, background: PB } })
      .composite([
        { input: photo, top: 351, left: 0 },
        { input: gradient, top: 1235, left: 0 },
        { input: header, top: 0, left: 0 },
        { input: action, top: 1755, left: 0 },
        { input: qr, top: 1975, left: 390 },
      ])
      .jpeg({ quality: 95 })
      .toBuffer()
    return new NextResponse(wallpaper as unknown as BodyInit, {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg', 'Content-Disposition': 'attachment; filename="telecard-wallpaper.jpg"' },
    })
  } catch (error: any) {
    console.error('Wallpaper error:', error)
    return NextResponse.json({ error: 'Failed to generate wallpaper', detail: error?.message || String(error) }, { status: 500 })
  }
}