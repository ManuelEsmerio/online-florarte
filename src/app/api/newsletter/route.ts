import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Mensaje genérico — no revela si el email ya estaba registrado ni su estado
const SUCCESS_MESSAGE = "¡Gracias! Si tu correo no estaba suscrito, recibirás novedades pronto."

// Sanitiza el user-agent: solo ASCII imprimible, máximo 300 chars
// Evita stored XSS si el campo se muestra en el panel admin sin escape
function sanitizeUserAgent(raw: string | null): string | null {
  if (!raw) return null
  return raw.replace(/[^\x20-\x7E]/g, '').slice(0, 300) || null
}

// Fuentes de suscripción permitidas
const ALLOWED_SOURCES = new Set(['footer', 'popup', 'checkout', 'blog', 'home'])

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    // Validar formato básico de email antes de procesar
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
    }

    // Whitelist de fuentes — rechaza valores arbitrarios
    const rawSource = typeof source === 'string' ? source.trim().toLowerCase() : null
    const normalizedSource = rawSource && ALLOWED_SOURCES.has(rawSource) ? rawSource : null

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = sanitizeUserAgent(req.headers.get('user-agent'))

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing && existing.isActive) {
      // Actualizar metadatos sin revelar que el email ya estaba registrado
      if (normalizedSource && existing.source !== normalizedSource) {
        await prisma.newsletterSubscriber.update({
          where: { email: normalizedEmail },
          data: { source: normalizedSource, ipAddress, userAgent },
        })
      }
      return NextResponse.json({ success: true, message: SUCCESS_MESSAGE })
    }

    if (existing && !existing.isActive) {
      await prisma.newsletterSubscriber.update({
        where: { email: normalizedEmail },
        data: {
          isActive: true,
          source: normalizedSource ?? existing.source,
          ipAddress,
          userAgent,
          unsubAt: null,
        },
      })
      return NextResponse.json({ success: true, message: SUCCESS_MESSAGE })
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        source: normalizedSource,
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE })

  } catch (error) {
    console.error('[NEWSLETTER_SUBSCRIBE_ERROR]', error)

    return NextResponse.json(
      { error: "Error al suscribirse" },
      { status: 500 }
    )
  }
}