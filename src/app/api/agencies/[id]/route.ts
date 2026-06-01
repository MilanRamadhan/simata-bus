import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { name, logo, description, contact, photos, rating, totalBuses, routes, ownerId } = body;

    const agency = await prisma.travelAgency.update({
      where: { id: params.id },
      data: {
        name,
        logo,
        description,
        contact: contact || null,
        photos: photos || null,
        rating: typeof rating === 'number' ? rating : 5.0,
        totalBuses: typeof totalBuses === 'number' ? totalBuses : 0,
        routes: typeof routes === 'string' ? routes : JSON.stringify(routes || []),
        ownerId: ownerId || null,
      },
    });
    return NextResponse.json(agency);
  } catch (error) {
    console.error('PUT /api/agencies error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    await prisma.travelAgency.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/agencies error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
