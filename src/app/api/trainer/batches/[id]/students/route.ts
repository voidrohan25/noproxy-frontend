import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/mock-db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = getSessionForUserId(userId);
    if (!session || (session.role !== 'TRAINER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Trainer or Admin access required' }, { status: 403 });
    }

    const { id: batchId } = await context.params;
    const body = await req.json();
    const { fullName, email } = body || {};

    if (!fullName || !fullName.trim() || !email || !email.trim()) {
      return NextResponse.json(
        { error: 'Student full name and valid email address are both required.' },
        { status: 400 }
      );
    }

    const result = db.enrollStudentByEmail({
      batchId,
      fullName: fullName.trim(),
      email: email.trim(),
      actorId: userId,
      actorRole: session.role,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      student: result.student,
      enrollment: result.enrollment,
      isNewStudent: result.isNewStudent,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = getSessionForUserId(userId);
    if (!session || (session.role !== 'TRAINER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Trainer or Admin access required' }, { status: 403 });
    }

    const { id: batchId } = await context.params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Missing required studentId parameter' }, { status: 400 });
    }

    // If trainer, check assigned
    if (session.role === 'TRAINER') {
      const isAssigned = Array.from(db.trainerAssignments.values()).some(
        (a) => a.trainerId === userId && a.batchId === batchId && a.status === 'ACTIVE'
      );
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden: You are not assigned to this batch' }, { status: 403 });
      }
    }

    const result = db.removeStudentFromBatch({
      batchId,
      studentId,
      actorId: userId,
      reason: 'Removed by batch trainer',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student successfully removed from batch. Account and historical records preserved.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
