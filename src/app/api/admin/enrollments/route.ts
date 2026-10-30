import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/roles';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = getSessionForUserId(userId);
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const batchId = searchParams.get('batchId');

    if (studentId) {
      const enrollments = db.listStudentBatchEnrollments(studentId);
      return NextResponse.json({ success: true, enrollments });
    }

    if (batchId) {
      const students = db.getBatchEnrolledStudents(batchId);
      return NextResponse.json({ success: true, students });
    }

    const allEnrollments = Array.from(db.studentEnrollments.values());
    return NextResponse.json({ success: true, enrollments: allEnrollments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = getSessionForUserId(userId);
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, batchId, rollNumber } = body;

    if (!studentId || !batchId) {
      return NextResponse.json(
        { error: 'Missing required parameters: studentId and batchId are mandatory.' },
        { status: 400 }
      );
    }

    const result = db.enrollStudentInBatch({
      institutionId: session.institution?.id || '11111111-1111-1111-1111-111111111111',
      studentId,
      batchId,
      rollNumber,
      actorId: userId,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      enrollment: result.enrollment,
      message: 'Student successfully enrolled into additional batch without altering prior enrollments.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = getSessionForUserId(userId);
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, batchId, reason } = body;

    if (!studentId || !batchId) {
      return NextResponse.json(
        { error: 'Missing required parameters: studentId and batchId are mandatory.' },
        { status: 400 }
      );
    }

    const result = db.removeStudentFromBatch({
      studentId,
      batchId,
      actorId: userId,
      reason: reason || 'Deactivated batch enrollment by administrator',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Batch enrollment deactivated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
