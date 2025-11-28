import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  // Get authenticated user
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  if (!currentUserId || !role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query: any = {};
  if (dateParam && dateParam !== 'undefined' && dateParam !== 'null') {
    const dateObj = new Date(dateParam);
    if (!isNaN(dateObj.getTime())) {
      query.date = {
        gte: new Date(`${dateParam}T00:00:00.000Z`),
        lte: new Date(`${dateParam}T23:59:59.999Z`),
      };
    }
  }

  // Role conditions
  const roleConditions = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
    parent: { students: { some: { parentId: currentUserId! } } },
  };

  query.OR = [
    { classId: null },
    { class: roleConditions[role as keyof typeof roleConditions] || {} },
  ];

  try {
    const prisma = new PrismaClient();
    const announcements = await prisma.announcement.findMany({
      where: query,
      include: {
        class: true,
      },
      take: 3, // Limit to 3 announcements
      orderBy: {
        date: 'desc',
      },
    });

    // console.log('API: Found announcements:', announcements.length, announcements.map(a => ({title: a.title, date: a.date})));

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}