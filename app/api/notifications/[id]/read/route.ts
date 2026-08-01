import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const POST = auth(async (req, context) => {
  if (!req.auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await (context.params as Promise<{ id: string }>);
    const id = params.id;

    await db.notification.update({
      where: { 
        id, 
        userId: req.auth.user.id 
      },
      data: { isRead: true },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return NextResponse.json({ error: "Failed to mark read" }, { status: 500 });
  }
});
