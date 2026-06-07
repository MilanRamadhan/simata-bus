import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schedules = await prisma.busSchedule.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const schedule = await prisma.busSchedule.create({
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
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
