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
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
  const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  return Buffer.from(base64, 'base64')
}

function buildHeaderSVG(): Buffer {
  const svg = `
    <svg width="${CANVAS_WIDTH}" height="351" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_WIDTH}" height="351" fill="#002D62"/>
      <text
        x="540"
        y="200"
        font-family="Inter, Arial, sans-serif"
        font-size="72"
        font-weight="700"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >TeleCard</text>
    </svg>
  `
  return Buffer.from(svg)
}

function buildActionZoneSVG(fullName: string, jobTitle: string, username: string): Buffer {
  const svg = `
    <svg width="${CANVAS_WIDTH}" height="585" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CANVAS_WIDTH}" height="585" fill="#002D62"/>

      <!-- Full Name -->
      <text
        x="540"
        y="80"
        font-family="Inter, Arial, sans-serif"
        font-size="52"
        font-weight="700"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >${fullName}</text>

      <!-- Job Title / Tagline -->
      <text
        x="540"
        y="155"
        font-family="Inter, Arial, sans-serif"
        font-size="32"
        font-weight="400"
        fill="${OXBLOOD}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${jobTitle}</text>

      <!-- QR placeholder box (will be composited separately) -->
      <rect x="400" y="195" width="280" height="280" fill="white" rx="8"/>

      <!-- URL below QR -->
      <text
        x="540"
        y="510"
        font-family="Inter, Arial, sans-serif"
        font-size="18"
        font-weight="400"
        fill="#aaaaaa"
        text-anchor="middle"
        dominant-baseline="middle"
      >telenamecard.vercel.app/${username}</text>
    </svg>
  `
  return Buffer.from(svg)
}

function buildGradientOverlaySVG(): Buffer {
  const svg = `
    <svg width="${CANVAS_WIDTH}" height="468" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#002D62" stop-opacity="0"/>
          <stop offset="100%" stop-color="#002D62" stop-opacity="0.8"/>
        </linearGradient>
      </defs>
      <rect width="${CANVAS_WIDTH}" height="468" fill="url(#fadeDown)"/>
    </svg>
  `
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

    // Read file as Uint8Array then convert to Buffer
    const arrayBuffer = await photoFile.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const photoBuffer = Buffer.from(uint8Array)

    // Validate it's a real image
    let metadata
    try {
      metadata = await sharp(photoBuffer).metadata()
    } catch (e: any) {
      return NextResponse.json({
        error: 'Invalid image. Please upload a real JPG or PNG photo.',
        detail: e?.message
      }, { status: 400 })
    }

// Validate image format before processing
    let imageInfo
    try {
  imageInfo = await sharp(photoBuffer).metadata()
  } catch {
  return NextResponse.json({ 
    error: 'Invalid image format. Please upload a JPG or PNG photo.' 
  }, { status: 400 })
}
    const profileUrl = `https://telenamecard.vercel.app/${username}`

    // 1. Resize user photo to fill the photo zone (1080 x 1404)
    const resizedPhoto = await sharp(photoBuffer)
      .rotate()
      .flatten({ background: { r: 0, g: 45, b: 98 } }) // fills transparency with Prussian Blue
      .resize(CANVAS_WIDTH, 1404, { fit: 'cover', position: 'center' })
      .jpeg()
      .toBuffer()

    // 2. Generate QR code buffer
    const qrBuffer = await generateQRBuffer(profileUrl)

    // 3. Build SVG layers
    const headerSVG = buildHeaderSVG()
    const actionSVG = buildActionZoneSVG(fullName, jobTitle, username)
    const gradientSVG = buildGradientOverlaySVG()

    // 4. Composite everything together
    const wallpaper = await sharp({
      create: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        channels: 3,
        background: PRUSSIAN_BLUE,
      },
    })
      .composite([
        // Photo zone (starts at y=351, height=1404)
        { input: resizedPhoto, top: 351, left: 0 },
        // Gradient overlay on bottom of photo
        { input: await sharp(gradientSVG).png().toBuffer(), top: 351 + 1404 - 468, left: 0 },
        // Header bar
        { input: await sharp(headerSVG).png().toBuffer(), top: 0, left: 0 },
        // Action zone (starts at y=1755)
        { input: await sharp(actionSVG).png().toBuffer(), top: 1755, left: 0 },
        // QR code composited into action zone QR box
        { input: await sharp(qrBuffer).resize(280, 280).toBuffer(), top: 1755 + 195, left: 400 },
      ])
      .jpeg({ quality: 95 })
      .toBuffer()

    return new NextResponse(wallpaper, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="telecard-wallpaper.jpg"`,
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