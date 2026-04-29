import QRCode from 'qrcode'
import sharp from 'sharp'

export async function generateBrandedQR(url: string, size: number = 280): Promise<Buffer> {
  // Generate QR at final size directly
  const qrDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    width: size,
    margin: 2,
    color: {
      dark: '#002D62',
      light: '#ffffff',
    },
  })

  const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '')
  const qrBuffer = Buffer.from(base64, 'base64')

  // TC logo — small centered box, same canvas size as QR
  const logoSize = Math.floor(size * 0.22)
  const logoX = Math.floor((size - logoSize) / 2)
  const logoY = Math.floor((size - logoSize) / 2)
  const fontSize = Math.floor(logoSize * 0.38)

  const logoSVG = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="${logoX - 3}" y="${logoY - 3}" width="${logoSize + 6}" height="${logoSize + 6}" rx="4" fill="white"/>` +
    `<rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="3" fill="#002D62"/>` +
    `<text x="${logoX + logoSize / 2}" y="${logoY + logoSize / 2 + fontSize * 0.35}" font-family="Arial" font-size="${fontSize}" font-weight="700" fill="white" text-anchor="middle">TC</text>` +
    `</svg>`
  )

  const logoBuffer = await sharp(logoSVG)
    .resize(size, size)
    .png()
    .toBuffer()

  const branded = await sharp(qrBuffer)
    .composite([{ input: logoBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer()

  return branded
}

export async function generateVCardQR(user: {
  fullName: string
  jobTitle?: string
  phone?: string
  username: string
  profileUrl: string
}): Promise<Buffer> {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${user.fullName}`,
    user.jobTitle ? `TITLE:${user.jobTitle}` : '',
    user.phone ? `TEL:${user.phone}` : '',
    `URL:${user.profileUrl}`,
    `NOTE:TeleCard @${user.username}`,
    'END:VCARD',
  ].filter(Boolean).join('\n')

  return generateBrandedQR(vcard, 280)
}