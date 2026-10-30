import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Session expired or invalid. Please sign in again.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { institutionId, batchId, studentIdNumber, submittedFullName } = body;

    if (!batchId || !studentIdNumber || !submittedFullName) {
      return NextResponse.json(
        { error: 'Please enter Batch, Student ID, and Full Name as officially enrolled.' },
        { status: 400 }
      );
    }

    const result = db.claimAuthoritativeStudent({
      userId,
      institutionId: institutionId || '11111111-1111-1111-1111-111111111111',
      batchId,
      studentIdNumber,
      submittedFullName,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profile: result.profile,
      message: 'Student identity successfully matched and verified against institutional roster.',
      redirectUrl: '/student',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
