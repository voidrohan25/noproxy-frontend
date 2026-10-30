import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, institutionId, students } = body;

    if (!batchId || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: 'Invalid import payload: batchId and array of student records are required.' },
        { status: 400 }
      );
    }

    const summary = db.importAuthoritativeRoster(
      batchId,
      institutionId || '11111111-1111-1111-1111-111111111111',
      students
    );

    return NextResponse.json({
      success: true,
      summary,
      message: `Import processed: ${summary.imported} students imported, ${summary.skipped} skipped.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
