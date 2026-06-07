import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
       orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      passengerId,
      passengerName,
      passengerNik,
      passengerPhone,
      passengerEmail,
      agencyName,
      busName,
      busClass,
      origin,
      destination,
      date,
      departureTime,
      arrivalTime,
      seatNumber,
      price,
      paymentMethod,
      status,
      bookingDate,
    } = body;

    // Jika tidak ada passengerId tapi ada email, coba cari user berdasarkan email
    let resolvedPassengerId = passengerId ?? null;
    if (!resolvedPassengerId && passengerEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: passengerEmail },
      });
      if (existingUser) {
        resolvedPassengerId = existingUser.id;
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        passengerId: resolvedPassengerId,
        passengerName,
        passengerNik,
        passengerPhone,
        passengerEmail: passengerEmail ?? null,
        agencyName,
        busName,
        busClass,
        origin,
        destination,
        date,
        departureTime,
        arrivalTime,
        seatNumber,
        price,
        paymentMethod,
        status: status ?? 'Lunas',
        bookingDate,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
