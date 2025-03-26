import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

 
// This function can be marked `async` if using `await` inside

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  const isAuthenticated = !!token;
  const hasVerifiedPhone = token?.whatsappVerified === true;

  const path = request.nextUrl.pathname;

  const isWhatsappVerificationApi = path.startsWith('/api/whatsapp') || path.includes('/send-code') || path.includes('/verify-code');
  const isPublicPath = path.startsWith('/_next/') || path.startsWith('/auth') || path.startsWith('/api/auth') || path === '/terms' || path === '/privacy' || path === '/' || path.startsWith("/static");

  if (isAuthenticated && !hasVerifiedPhone && !isPublicPath && !isWhatsappVerificationApi) {
    return NextResponse.redirect(new URL('/auth/verify', request.url));
  } 

  if (!isPublicPath && !isAuthenticated ) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isAuthenticated && hasVerifiedPhone && path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: '/:path*',
}