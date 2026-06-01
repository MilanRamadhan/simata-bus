import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get("agencyId");
    const userId = searchParams.get("userId");

    const reviews = await prisma.review.findMany({
      where: {
        ...(agencyId ? { agencyId } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userId, agencyId, rating, comment, photos } = data;

    if (!userId || !agencyId || typeof rating !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Cek apakah user sudah pernah review agency ini
    const existing = await prisma.review.findFirst({
      where: { userId, agencyId },
    });

    if (existing) {
      return NextResponse.json({ error: "Anda sudah memberikan ulasan untuk armada ini." }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: { userId, agencyId, rating, comment, photos },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
