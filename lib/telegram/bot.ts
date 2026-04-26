import { Bot, webhookCallback } from 'grammy'
import { createRawServiceClient } from '@/lib/supabase/server'
import type { ClientWithIntake } from '@/lib/supabase/types'
import {
  getClientByToken,
  linkChatId,
  saveExtractedFields,
  appendConversationHistory,
  getConversationHistory,
  markIntakeComplete,
  flattenAnswers,
} from './session'
import { geminiChat } from './gemini'

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

// /start — handles deep link token from broker-generated URL
bot.command('start', async (ctx) => {
  const token = ctx.match
  if (!token) {
    await ctx.reply(
      "Welcome! This bot is invite-only. Your broker will send you a link to get started."
    )
    return
  }

  const client = await getClientByToken(token)
  if (!client) {
    await ctx.reply(
      "That link isn't valid or has expired. Please ask your broker for a new one."
    )
    return
  }

  if (client.intake_status === 'complete') {
    await ctx.reply(
      `Hi ${client.owner_name}! Your intake for ${client.business_name} is already complete. Your broker will be in touch soon.`
    )
    return
  }

  await linkChatId(client.id, ctx.chat.id)

  const supabase = createRawServiceClient()
  await supabase.from('intake_data').upsert({
    client_id: client.id,
    current_question_key: 'gemini_active' as string,
  })

  const isDemoMode = client.intake_token.includes('demo')

  const greeting = isDemoMode
    ? `Hi ${client.owner_name}! 👋\n\n` +
      `I'm here to help ${client.business_name} get ready for commercial insurance.\n\n` +
      `I'll ask you a few quick questions — your answers help your broker put together ` +
      `the right coverage for your business.\n\nLet's get started!`
    : `Hi ${client.owner_name}! 👋\n\n` +
      `I'm here to help ${client.business_name} get ready for commercial insurance.\n\n` +
      `I'll ask you about 35 short questions through a quick conversation — ` +
      `you can stop and come back anytime, I'll save your progress.\n\n` +
      `Your answers help your broker submit a complete application that tells your full story, ` +
      `not just your ZIP code.\n\nLet's get started!`

  await ctx.reply(greeting)

  // Let Gemini open the conversation
  const collected = flattenAnswers(
    (client.intake_data?.[0] ?? { section_a: {}, section_b: {}, section_c: {}, section_d: {}, section_e: {} })
  )
  const gemini = await geminiChat(
    '__start__',
    client.owner_name,
    client.business_name,
    collected,
    [],
    isDemoMode
  )

  await ctx.reply(gemini.message)

  await appendConversationHistory(client.id, [
    { role: 'user', text: '__start__' },
    { role: 'model', text: gemini.message },
  ])

  if (Object.keys(gemini.fields).length > 0) {
    await saveExtractedFields(client.id, gemini.fields)
  }
})

// Handle all incoming messages and file uploads
// Skip command messages — handled by bot.command handlers above
bot.on('message', async (ctx) => {
  if (ctx.message.text?.startsWith('/')) return

  const chatId = ctx.chat.id
  const supabase = createRawServiceClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*, intake_data(*)')
    .eq('telegram_chat_id', chatId)
    .single() as { data: ClientWithIntake | null; error: unknown }

  if (!client) {
    await ctx.reply("Please use your broker's invite link to get started.")
    return
  }

  if (client.intake_status === 'complete') {
    await ctx.reply("Your intake is already complete! Your broker will be in touch soon.")
    return
  }

  const intakeData = Array.isArray(client.intake_data)
    ? client.intake_data[0]
    : client.intake_data

  const emptySection = { section_a: {}, section_b: {}, section_c: {}, section_d: {}, section_e: {} }
  const collected = flattenAnswers(intakeData ?? emptySection)

  // Handle photo/document uploads — store directly without going through Gemini
  const photoArray = ctx.message.photo
  const document = ctx.message.document
  const fileId = photoArray
    ? photoArray[photoArray.length - 1].file_id
    : document?.file_id

  if (fileId) {
    const file = await ctx.api.getFile(fileId)
    const ext = file.file_path?.split('.').pop() ?? 'bin'
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
    const response = await fetch(fileUrl)
    const buffer = await response.arrayBuffer()

    const uploadKey = photoArray ? 'photo_upload' : 'document_upload'
    const storagePath = `${client.id}/${uploadKey}_${Date.now()}.${ext}`
    const fileType = photoArray ? 'photo' : 'pdf'

    await supabase.storage
      .from('client-uploads')
      .upload(storagePath, buffer, { upsert: true })

    await (supabase.from('uploads') as any).insert({
      client_id: client.id,
      storage_path: storagePath,
      file_name: `${uploadKey}.${ext}`,
      file_type: fileType,
      label: photoArray ? 'Photo upload' : 'Document upload',
      telegram_file_id: fileId,
    })

    await ctx.reply("Got it — I've saved that file. ✅ You can continue answering questions or send more files.")
    return
  }

  // Text message — send to Gemini
  const userText = ctx.message.text ?? ''
  const history = await getConversationHistory(client.id)
  const isDemoMode = client.intake_token.includes('demo')

  let gemini
  try {
    gemini = await geminiChat(
      userText,
      client.owner_name,
      client.business_name,
      collected,
      history,
      isDemoMode
    )
  } catch (err) {
    console.error('Gemini error:', err)
    await ctx.reply("Sorry, I had a brief issue. Could you repeat that?")
    return
  }

  // Save extracted fields and conversation history
  if (Object.keys(gemini.fields).length > 0) {
    await saveExtractedFields(client.id, gemini.fields)
  }

  await appendConversationHistory(client.id, [
    { role: 'user', text: userText },
    { role: 'model', text: gemini.message },
  ])

  await ctx.reply(gemini.message)

  if (gemini.is_complete) {
    if (!isDemoMode) {
      await ctx.reply(
        `That's everything, ${client.owner_name}! 🎉\n\n` +
        `Your intake is complete. Your broker has been notified and will review your profile shortly.\n\n` +
        `If you have questions in the meantime, feel free to message here.`
      )
      await markIntakeComplete(client.id)
    }
  }
})

// Catch all unhandled Grammy errors so they never propagate to the route handler.
// Without this, any error causes a 500 → Telegram retries the same message indefinitely.
bot.catch((err) => {
  console.error('Bot error:', err.message)
})

export const handleWebhook = webhookCallback(bot, 'std/http')
export { bot }
