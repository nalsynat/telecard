import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import QRCode from 'qrcode'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 2340
const PRUSSIAN_BLUE = { r: 0, g: 45, b: 98 }
const OXBLOOD = '#7B001C'

async function generateQRBuffer(url: string): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    width: 280,
    margin: 4,
    color: { dark: '#000000', light: '#ffffff' },
  })
  const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  return Buffer.from(base64, 'base64')
}

function buildHeaderSVG(): Buffer {
  const svg = `<svg width="${CANVAS_WIDTH}" height="351" xmlns="http://www.w3.org/2000/svg"><rect width="${CANVAS_WIDTH}" height="351" fill="#002D62"/><text x="540" y="175" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">TeleCard</text></svg>`
  return Buffer.from(svg)
}

function buildActionZoneSVG(fullName: string, jobTitle: string, username: string): Buffer {
  const safeName = fullName.replace(/&/g, 'and').replace(/</g, '').replace(/>/g, '')
  const safeTitle = jobTitle.replace(/&/g, 'and').replace(/</g, '').replace(/>/g, '')
  const safeUsername = username.replace(/&/g, '').replace(/</g, '').replace(/>/g, '')
  const svg = `<svg width="${CANVAS_WIDTH}" height="585" xmlns="http://www.w3.org/2000/svg"><rect width="${CANVAS_WIDTH}" height="585" fill="#002D62"/><text x="540" y="80" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">${safeName}</text><text x="540" y="155" font-family="Arial, sans-serif" font-size="32" font-weight="400" fill="${OXBLOOD}" text-anchor="middle" dominant-baseline="middle">${safeTitle}</text><rect x="400" y="195" width="280" height="280" fill="white" rx="8"/><text x="540" y="510" font-family="Arial, sans-serif" font-size="18" font-weight="400" fill="#aaaaaa" text-anchor="middle" dominant-baseline="middle">telenamecard.vercel.app/${safeUsername}</text></svg>`
  return Buffer.from(svg)
}

function buildGradientOverlaySVG(): Buffer {
  const svg = `<svg width="${CANVAS_WIDTH}" height="468" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#002D62" stop-opacity="0"/><stop offset="100%" stop-color="#002D62" stop-opacity="0.8"/></linearGradient></defs><rect width="${CANVAS_WIDTH}" height="468" fill="url(#fadeDown)"/></svg>`
  return Buffer.from(svg)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const photoFile = formData.get('photo') as File
    const fullName = (formData.get('fullName') as string) || 'Your Name'
    const jobTitle = (formData.get('jobTitle') as string) || 'Your Title'
    const username = (formData.get('username') as string) || 'username'

    if (!photoFile) {
      return NextResponse.json({ error: 'Photo is required' }, { status: 400 })
    }

    const arrayBuffer = await photoFile.arrayBuffer()
    const photoBuffer = Buffer.from(new Uint8Array(arrayBuffer))

    const profileUrl = `https://telenamecard.vercel.app/${username}`

    const resizedPhoto = await sharp(photoBuffer)
      .rotate()
      .flatten({ background: { r: 0, g: 45, b: 98 } })
      .resize(CANVAS_WIDTH, 1404, { fit: 'cover', position: 'centre' })
      .jpeg()
      .toBuffer()

    const qrBuffer = await generateQRBuffer(profileUrl)
    const headerSVG = buildHeaderSVG()
    const actionSVG = buildActionZoneSVG(fullName, jobTitle, username)
    const gradientSVG = buildGradientOverlaySVG()

    const wallpaper = await sharp({
      create: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        channels: 3,
        background: PRUSSIAN_BLUE,
      },
    })
      .composite([
        { input: resizedPhoto, top: 351, left: 0 },
        { input: await sharp(Buffer.from(gradientSVG)).png().toBuffer(), top: 887, left: 0 },
        { input: await sharp(Buffer.from(headerSVG)).png().toBuffer(), top: 0, left: 0 },
        { input: await sharp(Buffer.from(actionSVG)).png().toBuffer(), top: 1755, left: 0 },
        { input: await sharp(qrBuffer).resize(280, 280).toBuffer(), top: 1950, left: 400 },
      ])
      .jpeg({ quality: 95 })
      .toBuffer()

    return new NextResponse(wallpaper as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="telecard-wallpaper.jpg"',
      },
    })
  } catch (error: any) {
    console.error('Wallpaper generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate wallpaper',
      detail: error?.message || String(error)
    }, { status: 500 })
  }
}