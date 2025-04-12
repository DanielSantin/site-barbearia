import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  const isAuthenticated = !!token;
  const hasVerifiedPhone = token?.whatsappVerified === true;

  const path = request.nextUrl.pathname;

  const isWhatsappVerificationApi = path.startsWith('/api/whatsapp') || path.includes('/send-code') || path.includes('/verify-code');
  
  const isPublicPath = 
    path.startsWith('/_next/') ||
    path.startsWith('/auth') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/static') ||
    path === '/' ||
    path === '/privacy-policy' ||
    path == '/api/user/report-bug'

  if (isAuthenticated && !hasVerifiedPhone && !isPublicPath && !isWhatsappVerificationApi) {
    return NextResponse.redirect(new URL('/auth/verify', request.url));
  } 

  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isAuthenticated && hasVerifiedPhone && path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
