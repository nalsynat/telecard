import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 })

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN!

    // Get file path from Telegram
    const fileRes = await fetch(
      'https://api.telegram.org/bot' + token + '/getFile?file_id=' + fileId
    )
    const fileData = await fileRes.json()

    if (!fileData.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const filePath = fileData.result.file_path
    const photoUrl = 'https://api.telegram.org/file/bot' + token + '/' + filePath

    // Fetch the actual photo
    const photoRes = await fetch(photoUrl)
    const photoBuffer = await photoRes.arrayBuffer()

    return new NextResponse(photoBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 })
  }
}