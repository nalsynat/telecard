import { Telegraf, Markup } from 'telegraf'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

const APP_URL = 'https://telenamecard.vercel.app'
const BOT_USERNAME = 'TeleNameCardBot'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateUser(ctx: any) {
  const telegramId = ctx.from.id
  const telegramName = ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : '')
  const telegramUsername = ctx.from.username || null

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (existing) return { user: existing, isNew: false }

  // Create stub user immediately — value on step one
  const username = telegramUsername || 'user' + telegramId
  const { data: newUser } = await supabaseAdmin
    .from('users')
    .insert({
      telegram_id: telegramId,
      full_name: telegramName,
      username: username,
      mode: 'PROFESSIONAL',
    })
    .select()
    .single()

  // Create stub profile
  if (newUser) {
    await supabaseAdmin.from('profiles').insert({
      user_id: newUser.id,
      job_title: '',
    })
  }

  return { user: newUser, isNew: true }
}

function profileUrl(username: string) {
  return `${APP_URL}/${username}`
}

// ── /start ───────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const param = (ctx.message as any).text?.split(' ')[1] || ''
  const { user, isNew } = await getOrCreateUser(ctx)
  if (!user) return

  // Handle scan deep link
  if (param.startsWith('scan_')) {
    const ownerId = param.replace('scan_', '')
    await supabaseAdmin.from('interactions').insert({
      owner_id: ownerId,
      visitor_info: {
        telegram_id: ctx.from.id,
        name: ctx.from.first_name,
        username: ctx.from.username || null,
        timestamp: new Date().toISOString(),
      },
      type: 'SCAN',
      location_verified: false,
    })

    // Notify card owner
    const { data: owner } = await supabaseAdmin
      .from('users')
      .select('telegram_id, full_name')
      .eq('id', ownerId)
      .single()

    if (owner && owner.telegram_id !== ctx.from.id) {
      try {
        await bot.telegram.sendMessage(
          owner.telegram_id,
          `Someone just viewed your TeleCard.\n\n👤 ${ctx.from.first_name}${ctx.from.username ? ' (@' + ctx.from.username + ')' : ''}\n\nYour card is working.`
        )
      } catch (e) {}
    }
  }

  if (isNew) {
    const url = profileUrl(user.username)
    await ctx.reply(
      `Hi ${ctx.from.first_name}! I'm Mali, your smart assistant.\n\nI just created your TeleCard:\n${url}\n\nLet's make it shine. What's your job title or role?`
    )
    await supabaseAdmin.from('users').update({ mode: 'PROFESSIONAL' }).eq('id', user.id)
  } else {
    const url = profileUrl(user.username)
    await ctx.reply(
      `Welcome back, ${ctx.from.first_name}!\n\nYour TeleCard: ${url}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('Switch Face', 'switch_face')],
        [Markup.button.callback('Edit Name', 'edit_name')],
        [Markup.button.callback('Edit Title', 'edit_title')],
      ])
    )
  }
})

// ── Callback actions ─────────────────────────────────────────────────────────

bot.action('switch_face', async (ctx) => {
  await ctx.answerCbQuery()
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('mode, username')
    .eq('telegram_id', ctx.from.id)
    .single()

  if (!user) return

  const newMode = user.mode === 'PROFESSIONAL' ? 'SELLER' : 'PROFESSIONAL'
  await supabaseAdmin.from('users').update({ mode: newMode }).eq('telegram_id', ctx.from.id)

  const modeLabel = newMode === 'PROFESSIONAL' ? 'Professional' : 'Seller'
  await ctx.reply(`Done. Your card now shows your ${modeLabel} face.\n\n${profileUrl(user.username)}`)
})

bot.action('edit_name', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply('Send me your new name:')
  await supabaseAdmin.from('users').update({ mode: 'PROFESSIONAL' }).eq('telegram_id', ctx.from.id)
  // Store state
  await supabaseAdmin.from('users').update({ username: '__awaiting_name__' + (await supabaseAdmin.from('users').select('username').eq('telegram_id', ctx.from.id).single()).data?.username }).eq('telegram_id', ctx.from.id)
})

bot.action('edit_title', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply('Send me your job title or tagline:')
})

// ── Photo handler — auto wallpaper ───────────────────────────────────────────

bot.on('photo', async (ctx) => {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*, profiles(*)')
    .eq('telegram_id', ctx.from.id)
    .single()

  if (!user) {
    await ctx.reply('Please start with /start first.')
    return
  }

  await ctx.reply('Got your photo. Generating your Smart Wallpaper...')

  try {
    // Get highest resolution photo
    const photos = ctx.message.photo
    const largestPhoto = photos[photos.length - 1]
    const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id)

    // Download photo
    const photoRes = await fetch(fileLink.href)
    const photoBuffer = Buffer.from(await photoRes.arrayBuffer())

    const profile = Array.isArray(user.profiles) ? user.profiles[0] : user.profiles
    const jobTitle = profile?.job_title || 'TeleCard'
    const username = user.username || String(ctx.from.id)

    // Call wallpaper API
    const formData = new FormData()
    const blob = new Blob([photoBuffer], { type: 'image/jpeg' })
    formData.append('photo', blob, 'photo.jpg')
    formData.append('fullName', user.full_name)
    formData.append('jobTitle', jobTitle)
    formData.append('username', username)

    const wallpaperRes = await fetch(`${APP_URL}/api/wallpaper`, {
      method: 'POST',
      body: formData,
    })

    if (!wallpaperRes.ok) {
      await ctx.reply('Sorry, wallpaper generation failed. Please try again.')
      return
    }

    const wallpaperBuffer = Buffer.from(await wallpaperRes.arrayBuffer())

    // Send wallpaper back
    await ctx.replyWithPhoto(
      { source: wallpaperBuffer, filename: 'telecard-wallpaper.jpg' },
      { caption: `Your Smart Wallpaper is ready.\n\nSet it as your lock screen — every phone that scans it opens your TeleCard.\n\n${profileUrl(username)}` }
    )

    // Save avatar URL (store file_id for future use)
    await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: largestPhoto.file_id })
      .eq('user_id', user.id)

  } catch (error: any) {
    console.error('Photo handler error:', error)
    await ctx.reply('Something went wrong. Please try again.')
  }
})

// ── Text handler — collect job title or name ──────────────────────────────────

bot.on('text', async (ctx) => {
  const text = ctx.message.text
  if (text.startsWith('/')) return

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*, profiles(*)')
    .eq('telegram_id', ctx.from.id)
    .single()

  if (!user) return

  const profile = Array.isArray(user.profiles) ? user.profiles[0] : user.profiles

  // If no job title yet — this is onboarding step 2
  if (!profile?.job_title || profile.job_title === '') {
    await supabaseAdmin
      .from('profiles')
      .update({ job_title: text })
      .eq('user_id', user.id)

    const url = profileUrl(user.username)
    await ctx.reply(
      `Perfect. Your TeleCard is ready:\n${url}\n\nNow send me your photo and I'll generate your Smart Wallpaper.`,
      Markup.inlineKeyboard([
        [Markup.button.callback('Switch Face', 'switch_face')],
      ])
    )
    return
  }

  // Otherwise treat as job title update
  await supabaseAdmin
    .from('profiles')
    .update({ job_title: text })
    .eq('user_id', user.id)

  await ctx.reply(`Updated. Your title is now: ${text}\n\nSend a photo to regenerate your wallpaper.`)
})

// ── /export ──────────────────────────────────────────────────────────────────

bot.command('export', async (ctx) => {
  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('telegram_id', ctx.from.id).single()

  if (!user) { await ctx.reply('Please start with /start first.'); return }

  const { data: interactions } = await supabaseAdmin
    .from('interactions').select('*').eq('owner_id', user.id)

  if (!interactions || interactions.length === 0) {
    await ctx.reply('No interactions yet. Share your TeleCard to start collecting data.')
    return
  }

  const header = 'id,type,location_verified,created_at\n'
  const rows = interactions.map(i =>
    `${i.id},${i.type},${i.location_verified},${i.created_at}`
  ).join('\n')

  await ctx.replyWithDocument({
    source: Buffer.from(header + rows, 'utf-8'),
    filename: `telecard-export-${Date.now()}.csv`,
  })
})

// ── Webhook ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await bot.handleUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Bot error:', error)
    return NextResponse.json({ ok: true })
  }
}