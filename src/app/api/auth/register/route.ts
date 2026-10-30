import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';
import { Profile } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, displayName } = body;

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Please provide full name, email, and a secure password.' },
        { status: 400 }
      );
    }

    const normEmail = email.trim().toLowerCase();
    if (db.credentials.has(normEmail)) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters in length.' },
        { status: 400 }
      );
    }

    const userId = `user-student-${Date.now()}`;
    const instId = '11111111-1111-1111-1111-111111111111'; // Default institution

    const newProfile: Profile = {
      id: userId,
      displayName: displayName.trim(),
      email: normEmail,
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.profiles.set(userId, newProfile);

    db.memberships.set(`mem-${userId}`, {
      id: `mem-${userId}`,
      institutionId: instId,
      userId,
      role: 'STUDENT',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    db.credentials.set(normEmail, {
      email: normEmail,
      passwordHash: password,
      role: 'STUDENT',
      userId,
      institutionId: instId,
    });

    db.studentProfiles.set(userId, {
      id: `sp-${userId}`,
      userId,
      institutionId: instId,
      fullName: displayName.trim(),
      isVerified: true,
      verificationStatus: 'VERIFIED',
      registeredAt: new Date().toISOString(),
      emergencyContactPhone: '',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully! Welcome to NoProxy.',
      redirectUrl: '/student',
    });

    response.cookies.set('noproxy_session_user', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
