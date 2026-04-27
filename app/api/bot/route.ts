import { Telegraf } from 'telegraf'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

bot.command('start', async (ctx) => {
  const telegramId = ctx.from.id
  const fullName = ctx.from.first_name + (ctx.from.last_name ? ' ' + ctx.from.last_name : '')

  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id, mode')
    .eq('telegram_id', telegramId)
    .single()

  if (existingUser) {
    await ctx.reply(`Welcome back, ${fullName}! Use /profile to view your card or /wallpaper to generate your Smart Wallpaper.`)
    return
  }

  await supabaseAdmin.from('users').insert({
    telegram_id: telegramId,
    full_name: fullName,
    username: ctx.from.username || null,
  })

  await ctx.reply(
    `Welcome to TeleCard, ${fullName}!\n\nYour digital identity for Cambodia.\n\nChoose your mode:`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Professional', callback_data: 'mode_PROFESSIONAL' },
            { text: 'Seller', callback_data: 'mode_SELLER' },
          ],
        ],
      },
    }
  )
})

bot.action('mode_PROFESSIONAL', async (ctx) => {
  await ctx.answerCbQuery()
  await supabaseAdmin.from('users').update({ mode: 'PROFESSIONAL' }).eq('telegram_id', ctx.from.id)
  await ctx.reply('Professional mode activated! Send me your job title to set up your card.')
})

bot.action('mode_SELLER', async (ctx) => {
  await ctx.answerCbQuery()
  await supabaseAdmin.from('users').update({ mode: 'SELLER' }).eq('telegram_id', ctx.from.id)
  await ctx.reply('Seller mode activated! Send me your shop tagline to set up your card.')
})

bot.command('profile', async (ctx) => {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('username, full_name, mode')
    .eq('telegram_id', ctx.from.id)
    .single()

  if (!user) { await ctx.reply('Please start with /start first.'); return }

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username || ctx.from.id}`
  await ctx.reply(`Your TeleCard Profile\n\nName: ${user.full_name}\nMode: ${user.mode}\nLink: ${profileUrl}`)
})

bot.command('wallpaper', async (ctx) => {
  await ctx.reply('Send me your professional photo and I will generate your Smart Wallpaper.')
})

bot.command('export', async (ctx) => {
  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('telegram_id', ctx.from.id).single()

  if (!user) { await ctx.reply('Please start with /start first.'); return }

  const { data: interactions } = await supabaseAdmin
    .from('interactions').select('*').eq('owner_id', user.id)

  if (!interactions || interactions.length === 0) {
    await ctx.reply('No interactions yet.')
    return
  }

  const header = 'id,type,location_verified,created_at\n'
  const rows = interactions.map(i => `${i.id},${i.type},${i.location_verified},${i.created_at}`).join('\n')

  await ctx.replyWithDocument({
    source: Buffer.from(header + rows, 'utf-8'),
    filename: `telecard-export-${Date.now()}.csv`,
  })
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  await bot.handleUpdate(body)
  return NextResponse.json({ ok: true })
}