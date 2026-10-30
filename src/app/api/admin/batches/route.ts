import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = getSessionForUserId(userId);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const institutionId = session.institution?.id || '11111111-1111-1111-1111-111111111111';
    const allBatches = db.listBatches(institutionId);

    const detailedBatches = allBatches.map((b) => {
      const students = db.getBatchEnrolledStudents(b.id);
      const assignment = Array.from(db.trainerAssignments.values()).find(
        (a) => a.batchId === b.id && a.status === 'ACTIVE'
      );
      const trainer = assignment ? db.profiles.get(assignment.trainerId) : undefined;
      const activeSession = Array.from(db.sessions.values()).find(
        (s) => s.batchId === b.id && s.sessionStatus === 'ACTIVE'
      );

      return {
        ...b,
        enrolledCount: students.length,
        students: students.map((s) => ({
          id: s.student.id,
          displayName: s.student.displayName,
          email: s.student.email,
        })),
        trainer: trainer
          ? {
              id: trainer.id,
              displayName: trainer.displayName,
              email: trainer.email,
            }
          : null,
        activeSession: activeSession
          ? {
              id: activeSession.id,
              title: activeSession.title,
              sessionStatus: activeSession.sessionStatus,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      batches: detailedBatches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

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
    const { name, startDate, endDate, trainerId } = body || {};

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Batch name is required.' }, { status: 400 });
    }

    const result = db.createBatch({
      name: name.trim(),
      startDate,
      endDate,
      trainerId,
      institutionId: session.institution?.id || '11111111-1111-1111-1111-111111111111',
    });

    if (!result.success || !result.batch) {
      return NextResponse.json({ error: result.error || 'Failed to create batch.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      batch: result.batch,
      message: `Batch "${result.batch.name}" created successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
