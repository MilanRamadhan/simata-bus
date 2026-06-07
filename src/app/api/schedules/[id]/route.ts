import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await request.json();
    const schedule = await prisma.busSchedule.update({
      where: { id: params.id },
      data: {
        agencyId:         body.agencyId,
        agencyName:       body.agencyName,
        busName:          body.busName,
        origin:           body.origin,
        destination:      body.destination,
        date:             body.date      ?? '',
        departureTime:    body.departureTime,
        arrivalTime:      body.arrivalTime,
        price:            Number(body.price),
        totalSeats:       Number(body.totalSeats),
        bookedSeats:      body.bookedSeats ?? '[]',
        busClass:         body.busClass,
        isRecurring:      body.isRecurring  ?? false,
        recurringDays:    body.recurringDays ?? null,
        scheduleStatus:   body.scheduleStatus   ?? 'aktif',
        delayNote:        body.delayNote        ?? null,
        newDepartureTime: body.newDepartureTime  ?? null,
        dateOverrides:    body.dateOverrides     ?? '[]',
      },
    });
    return NextResponse.json(schedule);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    await prisma.busSchedule.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
