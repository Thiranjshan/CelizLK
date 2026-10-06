import { NextResponse } from 'next/server';
import { getAdminFromRequest, writeAudit } from '@/lib/admin-auth';
import { getStoreSettings, normalizeStoreSettings, saveStoreSettings } from '@/lib/store-settings';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (admin.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  return NextResponse.json(await getStoreSettings());
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (admin.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  try {
    const value = await request.json();
    const normalized = normalizeStoreSettings(value);
    const serialized = JSON.stringify(normalized);

    if (serialized.length > 20000) return NextResponse.json({ error: 'Settings are too large.' }, { status: 400 });

    const saved = await saveStoreSettings(normalized);
    await writeAudit(admin.id, 'UPDATE', 'SETTINGS', 'settings', saved);
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: 'Invalid settings payload.' }, { status: 400 });
  }
}