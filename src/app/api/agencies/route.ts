import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agencies = await prisma.travelAgency.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(agencies);
  } catch (error) {
    console.error('GET /api/agencies error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, logo, description, contact, photos, rating, totalBuses, routes, ownerId } = body;

    const agency = await prisma.travelAgency.create({
      data: {
        name,
        logo: logo || '🚌',
        description: description || '',
        contact: contact || null,
        photos: photos || null,
        rating: typeof rating === 'number' ? rating : 5.0,
        totalBuses: typeof totalBuses === 'number' ? totalBuses : 0,
        routes: typeof routes === 'string' ? routes : JSON.stringify([]),
        ownerId: ownerId || null,
      },
    });
    return NextResponse.json(agency, { status: 201 });
  } catch (error) {
    console.error('POST /api/agencies error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
