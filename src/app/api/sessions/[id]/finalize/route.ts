import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { actorId } = body;

    if (!actorId) {
      return NextResponse.json({ error: 'Missing actorId for authorization audit' }, { status: 400 });
    }

    const result = db.finalizeSession(sessionId, actorId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      status: 'FINALIZED',
      absentMarkedCount: result.absentCount,
      totalStudents: result.finalizedCount,
      message: `Session finalized. ${result.absentCount} non-recorded students marked ABSENT. Session is now locked.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
