import { NextRequest, NextResponse } from 'next/server';
import { getSessionForUserId } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/roles';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('noproxy_session_user')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const session = getSessionForUserId(userId);
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Sensitive institute GPS coordinates and network CIDRs are restricted strictly to Administrators.' },
        { status: 403 }
      );
    }

    const institutionId = session.institution?.id || '11111111-1111-1111-1111-111111111111';
    const result = db.listClassroomsAdmin(institutionId, session.role);

    return NextResponse.json(result);
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
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Administrators are authorized to update institute geofencing and network verification settings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      classroomId,
      name,
      building,
      roomNumber,
      latitude,
      longitude,
      geofenceRadiusMeters,
      requiredGpsAccuracyMeters,
      allowedNetworkCidrs,
      gpsVerificationEnabled,
      gpsMandatory,
      networkVerificationEnabled,
      networkMandatory,
      reason,
    } = body;

    if (!classroomId || latitude === undefined || longitude === undefined || !geofenceRadiusMeters) {
      return NextResponse.json(
        { error: 'Missing required location settings: classroomId, latitude, longitude, and geofenceRadiusMeters are mandatory.' },
        { status: 400 }
      );
    }

    const result = db.updateClassroomSettings({
      classroomId,
      userRole: session.role,
      actorId: userId,
      name,
      building,
      roomNumber,
      latitude: Number(latitude),
      longitude: Number(longitude),
      geofenceRadiusMeters: Number(geofenceRadiusMeters),
      requiredGpsAccuracyMeters: Number(requiredGpsAccuracyMeters || 30),
      allowedNetworkCidrs: Array.isArray(allowedNetworkCidrs) ? allowedNetworkCidrs : [],
      gpsVerificationEnabled: gpsVerificationEnabled ?? true,
      gpsMandatory: gpsMandatory ?? true,
      networkVerificationEnabled: networkVerificationEnabled ?? false,
      networkMandatory: networkMandatory ?? false,
      reason: reason || 'Updated classroom coordinates and geofence verification settings',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      classroom: result.classroom,
      message: 'Classroom location and network settings updated and audited successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
