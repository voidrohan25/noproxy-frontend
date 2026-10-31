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
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TRAINER')) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Trainer access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (batchId) {
      if (session.role === 'TRAINER') {
        const isAssigned = Array.from(db.trainerAssignments.values()).some(
          (a) => a.trainerId === userId && a.batchId === batchId && a.status === 'ACTIVE'
        );
        if (!isAssigned) {
          return NextResponse.json({ error: 'Forbidden: You are not assigned to view students in this batch' }, { status: 403 });
        }
      }

      const students = db.getBatchEnrolledStudents(batchId);
      return NextResponse.json({
        success: true,
        students: students.map((s) => ({
          id: s.student.id,
          displayName: s.student.displayName,
          email: s.student.email,
        })),
      });
    }

    // Listing all institute students is restricted to ADMIN
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Viewing institute-wide directory is restricted to Administrators' }, { status: 403 });
    }

    // List all students across the institute
    const studentUserIds = new Set(
      Array.from(db.memberships.values())
        .filter((m) => m.role === 'STUDENT')
        .map((m) => m.userId)
    );
    const allStudents = Array.from(db.profiles.values())
      .filter((p) => studentUserIds.has(p.id) || p.role === 'STUDENT')
      .map((student) => {
        const enrollments = Array.from(db.studentEnrollments.values())
          .filter((e) => e.studentId === student.id && e.status === 'ACTIVE')
          .map((e) => {
            const batch = db.batches.get(e.batchId);
            return {
              batchId: e.batchId,
              batchName: batch?.name || 'Batch',
              enrolledAt: e.enrolledAt || e.createdAt || new Date().toISOString(),
            };
          });

        return {
          id: student.id,
          displayName: student.displayName,
          email: student.email,
          accountStatus: student.accountStatus,
          createdAt: student.createdAt,
          enrollments,
        };
      });

    return NextResponse.json({ success: true, students: allStudents });
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
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TRAINER')) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Trainer access required' }, { status: 403 });
    }

    const body = await req.json();
    const { batchId, fullName, email, studentIdNumber } = body;

    if (!batchId || !fullName || (!email && !studentIdNumber)) {
      return NextResponse.json(
        { error: 'Missing batchId, fullName, or email.' },
        { status: 400 }
      );
    }

    if (session.role === 'TRAINER') {
      const isAssigned = Array.from(db.trainerAssignments.values()).some(
        (a) => a.trainerId === userId && a.batchId === batchId && a.status === 'ACTIVE'
      );
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden: You are not assigned to enroll students into this batch' }, { status: 403 });
      }
    }

    const studentEmail = email || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@student.edu`;

    const result = db.enrollStudentByEmail({
      batchId,
      fullName: fullName.trim(),
      email: studentEmail.trim(),
      actorId: userId,
      actorRole: session.role,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      student: result.student,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
