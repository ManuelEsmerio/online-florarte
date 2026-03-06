// src/app/api/auth/verification-status/route.ts
// Lightweight polling endpoint — called every 4 s from the /verify-email page
// while the user is waiting to click the link in their inbox.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  // 60 polls/min per IP — generous for 4-second polling but prevents abuse
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`verify_status_ip:${ip}`, 60, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ verified: false }, { status: 429 });
  }

  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim() ?? '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerifiedAt: true, isDeleted: true },
  });

  // Return false for unknown / deleted users — avoids user enumeration
  const verified = Boolean(user && !user.isDeleted && user.emailVerifiedAt !== null);

  return NextResponse.json({ verified });
}
