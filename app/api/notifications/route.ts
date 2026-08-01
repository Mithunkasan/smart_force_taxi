import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = auth(async (req) => {
  if (!req.auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await db.notification.findMany({
      where: { userId: req.auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
