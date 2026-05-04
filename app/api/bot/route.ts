import { Telegraf, Markup } from 'telegraf'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)
const APP_URL = 'https://telenamecard.vercel.app'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getOrCreateUser(ctx: any) {
  const telegramId = ctx.from.id
  const telegramName = ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : '')
  const telegramUsername = ctx.from.username || null

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (existing) {
    // Ensure profile exists for existing users too
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', existing.id)
      .single()

    if (!profile) {
      await supabaseAdmin.from('profiles').insert({
        user_id: existing.id,
        job_title: '',
      })
    }
    return { user: existing, isNew: false }
  }

  // Create new user
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

  // Always create profile for new user
  if (newUser) {
    await supabaseAdmin.from('profiles').insert({
      user_id: newUser.id,
      job_title: '',
    })
  }

  return { user: newUser, isNew: true }
}

function profileUrl(username: string) {
  return APP_URL + '/' + username
}

async function setMenuButton(telegramId: number, webAppUrl: string) {
  try {
    await bot.telegram.callApi('setChatMenuButton', {
      chat_id: telegramId,
      menu_button: {
        type: 'web_app',
        text: 'My TeleCard',
        web_app: { url: webAppUrl },
      },
    })
  } catch (e) {}
}

// ── /start ────────────────────────────────────────────────────────────────────

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
          'Someone just viewed your TeleCard.\n\n' +
          ctx.from.first_name +
          (ctx.from.username ? ' (@' + ctx.from.username + ')' : '') +
          '\n\nYour card is working.'
        )
      } catch (e) {}
    }
  }

  // Set menu button to open profile
  const url = profileUrl(user.username)
  await setMenuButton(ctx.from.id, url)

  if (isNew) {
    await ctx.reply(
      'Hi ' + ctx.from.first_name + '! I am Mali, your smart assistant.\n\n' +
      'I just created your TeleCard:\n' + url + '\n\n' +
      'What is your job title or role?'
    )
  } else {
    await ctx.reply(
      'Welcome back, ' + ctx.from.first_name + '!\n\n' +
      'Your TeleCard: ' + url,
      Markup.inlineKeyboard([
        [Markup.button.callback('Switch Face', 'switch_face')],
        [Markup.button.callback('Edit Name', 'edit_name')],
        [Markup.button.callback('Edit Title', 'edit_title')],
      ])
    )
  }
})

// ── Callback actions ──────────────────────────────────────────────────────────

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
  await ctx.reply('Done. Your card now shows your ' + modeLabel + ' face.\n\n' + profileUrl(user.username))
})

bot.action('edit_name', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply('Send me your new name:')
})

bot.action('edit_title', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply('Send me your job title or tagline:')
})

// ── Photo handler ─────────────────────────────────────────────────────────────

bot.on('photo', async (ctx) => {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', ctx.from.id)
    .single()

  if (!user) { await ctx.reply('Please send /start first.'); return }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  await ctx.reply('Got your photo. Generating your Smart Wallpaper...')

  try {
    const photos = ctx.message.photo
    const largestPhoto = photos[photos.length - 1]
    const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id)

    const photoRes = await fetch(fileLink.href)
    const photoBuffer = Buffer.from(await photoRes.arrayBuffer())

    const jobTitle = (profile?.job_title && profile.job_title !== '') ? profile.job_title : 'TeleCard'
    const username = user.username || String(ctx.from.id)

    const formData = new FormData()
    const blob = new Blob([photoBuffer], { type: 'image/jpeg' })
    formData.append('photo', blob, 'photo.jpg')
    formData.append('fullName', user.full_name)
    formData.append('jobTitle', jobTitle)
    formData.append('username', username)

    const wallpaperRes = await fetch(APP_URL + '/api/wallpaper', {
      method: 'POST',
      body: formData,
    })

    if (!wallpaperRes.ok) {
      await ctx.reply('Sorry, wallpaper generation failed. Please try again.')
      return
    }

    const wallpaperBuffer = Buffer.from(await wallpaperRes.arrayBuffer())

    await ctx.replyWithPhoto(
      { source: wallpaperBuffer, filename: 'telecard-wallpaper.jpg' },
      {
        caption:
          'Your Smart Wallpaper is ready.\n\n' +
          'Set it as your lock screen — every phone that scans it opens your TeleCard.\n\n' +
          profileUrl(username)
      }
    )

    // Save avatar file_id
    await supabaseAdmin
      .from('profiles')
      .upsert({ user_id: user.id, avatar_url: largestPhoto.file_id })

  } catch (error: any) {
    console.error('Photo handler error:', error)
    await ctx.reply('Something went wrong. Please try again.')
  }
})

// ── Text handler ──────────────────────────────────────────────────────────────

bot.on('text', async (ctx) => {
  const text = ctx.message.text
  if (text.startsWith('/')) return

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', ctx.from.id)
    .single()

  if (!user) return

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Check if this looks like a name (contains space or is short)
  const looksLikeName = text.split(' ').length >= 2 && text.length < 50

  // If no job title yet — onboarding step 2
  if (!profile?.job_title || profile.job_title === '') {
    await supabaseAdmin
      .from('profiles')
      .update({ job_title: text })
      .eq('user_id', user.id)

    const url = profileUrl(user.username)
    await ctx.reply(
      'Perfect. Your TeleCard is ready:\n' + url + '\n\n' +
      'Now send me your photo and I will generate your Smart Wallpaper.',
      Markup.inlineKeyboard([
        [Markup.button.callback('Switch Face', 'switch_face')],
      ])
    )
    return
  }

  // Otherwise treat as title update
  await supabaseAdmin
    .from('profiles')
    .update({ job_title: text })
    .eq('user_id', user.id)

  await ctx.reply('Updated. Your title is now: ' + text + '\n\nSend a photo to regenerate your wallpaper.')
})

// ── /export ───────────────────────────────────────────────────────────────────

bot.command('export', async (ctx) => {
  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('telegram_id', ctx.from.id).single()

  if (!user) { await ctx.reply('Please send /start first.'); return }

  const { data: interactions } = await supabaseAdmin
    .from('interactions').select('*').eq('owner_id', user.id)

  if (!interactions || interactions.length === 0) {
    await ctx.reply('No interactions yet. Share your TeleCard to start collecting data.')
    return
  }

  const header = 'id,type,location_verified,created_at\n'
  const rows = interactions.map((i: any) =>
    i.id + ',' + i.type + ',' + i.location_verified + ',' + i.created_at
  ).join('\n')

  await ctx.replyWithDocument({
    source: Buffer.from(header + rows, 'utf-8'),
    filename: 'telecard-export-' + Date.now() + '.csv',
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