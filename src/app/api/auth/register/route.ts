import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, nik, phone } = body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "provider" ? "provider" : "customer",
        nik: nik?.trim() || null,
        phone: phone?.trim() || null,
      },
    });

    // Auto-link tiket yang dibeli tanpa login menggunakan email yang sama
    // Tiket yang passengerEmail-nya cocok dan belum punya passengerId
    await prisma.ticket.updateMany({
      where: {
        passengerId: null,
        passengerEmail: email,
      },
      data: {
        passengerId: user.id,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
