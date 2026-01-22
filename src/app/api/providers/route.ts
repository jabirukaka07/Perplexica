import ModelRegistry from '@/lib/models/registry';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/userAuth';

export async function GET() {
  try {
    const registry = new ModelRegistry();

    const activeProviders = await registry.getActiveProviders();

    const filteredProviders = activeProviders.filter((p) => {
      return !p.chatModels.some((m) => m.key === 'error');
    });

    return NextResponse.json(
      { providers: filteredProviders },
      { status: 200 },
    );
  } catch (err) {
    console.error('An error occurred while fetching providers', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Admin privileges required' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { type, name, config } = body;

    if (!type || !name || !config) {
      return NextResponse.json(
        { message: 'Missing required fields.' },
        { status: 400 },
      );
    }

    const registry = new ModelRegistry();

    const newProvider = await registry.addProvider(type, name, config);

    console.log(`[Providers] Admin created provider: ${name} (${type})`);

    return NextResponse.json(
      { provider: newProvider },
      { status: 200 },
    );
  } catch (err) {
    console.error('An error occurred while creating provider', err);
    return NextResponse.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}
