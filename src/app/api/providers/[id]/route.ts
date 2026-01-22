import ModelRegistry from '@/lib/models/registry';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/userAuth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Admin privileges required' },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: 'Provider ID is required.' },
        { status: 400 },
      );
    }

    const registry = new ModelRegistry();
    await registry.removeProvider(id);

    console.log(`[Providers] Admin deleted provider: ${id}`);

    return NextResponse.json(
      { message: 'Provider deleted successfully.' },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('An error occurred while deleting provider', message);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Admin privileges required' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { name, config } = body;
    const { id } = await params;

    if (!id || !name || !config) {
      return NextResponse.json(
        { message: 'Missing required fields.' },
        { status: 400 },
      );
    }

    const registry = new ModelRegistry();

    const updatedProvider = await registry.updateProvider(id, name, config);

    console.log(`[Providers] Admin updated provider: ${id} (${name})`);

    return NextResponse.json(
      { provider: updatedProvider },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('An error occurred while updating provider', message);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}
