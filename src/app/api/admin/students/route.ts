import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId') || '77777777-7777-7777-7777-777777777771';

  const roster = db.listAuthoritativeRoster(batchId);
  return NextResponse.json({ success: true, roster });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batchId, studentIdNumber, fullName, email, institutionId } = body;

    if (!batchId || !studentIdNumber || !fullName) {
      return NextResponse.json(
        { error: 'Missing batchId, studentIdNumber, or fullName.' },
        { status: 400 }
      );
    }

    const result = db.addAuthoritativeStudent({
      institutionId: institutionId || '11111111-1111-1111-1111-111111111111',
      batchId,
      studentIdNumber,
      fullName,
      email,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      student: result.student,
      message: `Student ${fullName} (${studentIdNumber}) added to authoritative batch roster.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
