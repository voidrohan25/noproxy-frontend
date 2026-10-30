import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/mock-db';

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = getSessionForUserId(userId);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { trainerId, batchId } = body || {};

    if (!trainerId || !batchId) {
      return NextResponse.json({ error: 'Both trainerId and batchId are required.' }, { status: 400 });
    }

    const result = db.assignTrainerToBatch({
      trainerId,
      batchId,
      institutionId: session.institution?.id || '11111111-1111-1111-1111-111111111111',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      assignment: result.assignment,
      message: 'Trainer assigned to batch successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
