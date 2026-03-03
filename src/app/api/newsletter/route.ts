import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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
    const normalizedSource = typeof source === 'string' ? source.trim().toLowerCase() : null
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = req.headers.get('user-agent') || null

    // 1. Buscar primero
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    })

    // 2. Ya existe y está activo
    if (existing && existing.isActive) {
      if ((normalizedSource && existing.source !== normalizedSource) || existing.ipAddress !== ipAddress || existing.userAgent !== userAgent) {
        await prisma.newsletterSubscriber.update({
          where: { email: normalizedEmail },
          data: {
            source: normalizedSource ?? existing.source,
            ipAddress,
            userAgent,
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: "Ya estás suscrito 😊",
      })
    }

    // 3. Existe pero estaba inactivo
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

      return NextResponse.json({
        success: true,
        message: "Suscripción reactivada 🎉",
      })
    }

    // 4. No existe → crear
    await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        source: normalizedSource,
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Suscripción exitosa 💐",
    })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Error al suscribirse" },
      { status: 500 }
    )
  }
}