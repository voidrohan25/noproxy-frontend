import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithCredentials } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both email address and password.' },
        { status: 400 }
      );
    }

    const authRes = authenticateWithCredentials(email, password);
    if (!authRes.success || !authRes.session) {
      return NextResponse.json(
        { error: authRes.error || 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const { role, user, studentProfile } = authRes.session;

    let redirectUrl = '/';
    if (role === 'ADMIN') {
      redirectUrl = '/admin';
    } else if (role === 'TRAINER') {
      redirectUrl = '/trainer';
    } else if (role === 'STUDENT') {
      if (!studentProfile || !studentProfile.isVerified) {
        redirectUrl = '/student/complete-registration';
      } else {
        redirectUrl = '/student';
      }
    }

    const response = NextResponse.json({
      success: true,
      role,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      redirectUrl,
    });

    // Set secure session cookie
    response.cookies.set('noproxy_session_user', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
