import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        const email = data.user.email?.toLowerCase().trim() || '';
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          email.split('@')[0] ||
          'Student User';

        // Check if student profile exists in NoProxy store
        let student = Array.from(db.profiles.values()).find(
          (p) => p.email.toLowerCase() === email
        );

        let userId = student?.id;
        const instId = '11111111-1111-1111-1111-111111111111';

        if (!student) {
          userId = `stud-${Date.now()}`;
          db.profiles.set(userId, {
            id: userId,
            displayName: fullName,
            email,
            role: 'STUDENT',
            accountStatus: 'ACTIVE',
            avatarUrl: data.user.user_metadata?.avatar_url || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          db.studentProfiles.set(userId, {
            id: `sp-${userId}`,
            userId,
            institutionId: instId,
            fullName,
            isVerified: true,
            verificationStatus: 'VERIFIED',
            registeredAt: new Date().toISOString(),
            emergencyContactPhone: '',
          });

          db.memberships.set(`mem-${userId}`, {
            id: `mem-${userId}`,
            institutionId: instId,
            userId,
            role: 'STUDENT',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          });

          db.credentials.set(email, {
            userId,
            email,
            passwordHash: 'GoogleOAuthUser2026!',
            role: 'STUDENT',
            institutionId: instId,
          });
        }

        // Determine destination: trainer, admin, or student
        const membership = Array.from(db.memberships.values()).find((m) => m.userId === userId);
        let destination = '/student';
        if (membership?.role === 'ADMIN') {
          destination = '/admin';
        } else if (membership?.role === 'TRAINER') {
          destination = '/trainer';
        }

        // Redirect to appropriate portal with secure session cookie
        const response = NextResponse.redirect(`${origin}${destination}`);
        response.cookies.set('noproxy_session_user', userId!, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      }
    } catch (err) {
      console.error('Google Auth callback exception:', err);
    }
  }

  // Fallback to login with error
  return NextResponse.redirect(`${origin}/login?error=GoogleAuthFailed`);
}
