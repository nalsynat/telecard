import { Bot, webhookCallback } from 'telegraf'
import { supabaseAdmin } from '@/lib/supabase'

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

// /start command — onboarding entry point
bot.command('start', async (ctx) => {
  const telegramId = ctx.from.id
  const fullName = ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : '')

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id, mode')
    .eq('telegram_id', telegramId)
    .single()

  if (existingUser) {
    await ctx.reply(`Welcome back, ${fullName}! 👋\n\nUse /profile to view your card or /wallpaper to generate your Smart Wallpaper.`)
    return
  }

  // New user — start onboarding
  await supabaseAdmin.from('users').insert({
    telegram_id: telegramId,
    full_name: fullName,
    username: ctx.from.username || null,
  })

  await ctx.reply(
    `👋 Welcome to *TeleCard*, ${fullName}!\n\nYour digital identity for Cambodia's professionals and sellers.\n\nFirst, choose your mode:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💼 Professional', callback_data: 'mode_PROFESSIONAL' },
            { text: '🛍️ Seller', callback_data: 'mode_SELLER' },
          ],
        ],
      },
    }
  )
})

// Mode selection
bot.action('mode_PROFESSIONAL', async (ctx) => {
  await ctx.answerCbQuery()
  const telegramId = ctx.from.id

  await supabaseAdmin
    .from('users')
    .update({ mode: 'PROFESSIONAL' })
    .eq('telegram_id', telegramId)

  await ctx.reply(
    `💼 *Professional mode activated!*\n\nNow send me your job title so we can set up your card.`,
    { parse_mode: 'Markdown' }
  )
})

bot.action('mode_SELLER', async (ctx) => {
  await ctx.answerCbQuery()
  const telegramId = ctx.from.id

  await supabaseAdmin
    .from('users')
    .update({ mode: 'SELLER' })
    .eq('telegram_id', telegramId)

  await ctx.reply(
    `🛍️ *Seller mode activated!*\n\nNow send me your shop name or tagline so we can set up your card.`,
    { parse_mode: 'Markdown' }
  )
})

// /profile command
bot.command('profile', async (ctx) => {
  const telegramId = ctx.from.id

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('username, full_name, mode')
    .eq('telegram_id', telegramId)
    .single()

  if (!user) {
    await ctx.reply('Please start with /start first.')
    return
  }

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username || telegramId}`

  await ctx.reply(
    `🪪 *Your TeleCard Profile*\n\n` +
    `Name: ${user.full_name}\n` +
    `Mode: ${user.mode}\n` +
    `Link: ${profileUrl}`,
    { parse_mode: 'Markdown' }
  )
})

// /wallpaper command
bot.command('wallpaper', async (ctx) => {
  await ctx.reply('📸 Send me your professional photo and I will generate your Smart Wallpaper.')
})

// /export command
bot.command('export', async (ctx) => {
  const telegramId = ctx.from.id

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('telegram_id', telegramId)
    .single()

  if (!user) {
    await ctx.reply('Please start with /start first.')
    return
  }

  const { data: interactions } = await supabaseAdmin
    .from('interactions')
    .select('*')
    .eq('owner_id', user.id)

  if (!interactions || interactions.length === 0) {
    await ctx.reply('No interactions yet. Share your TeleCard link to start collecting data.')
    return
  }

  // Build CSV
  const header = 'id,type,location_verified,created_at\n'
  const rows = interactions.map(i =>
    `${i.id},${i.type},${i.location_verified},${i.created_at}`
  ).join('\n')

  const csv = header + rows

  await ctx.replyWithDocument({
    source: Buffer.from(csv, 'utf-8'),
    filename: `telecard-export-${Date.now()}.csv`,
  })
})

export const POST = webhookCallback(bot, 'std/http')