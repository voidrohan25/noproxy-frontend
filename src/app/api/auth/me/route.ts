import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const userId = req.cookies.get('noproxy_session_user')?.value;

  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = getSessionForUserId(userId);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
    },
    role: session.role,
    institution: session.institution,
    studentProfile: session.studentProfile,
  });
}
