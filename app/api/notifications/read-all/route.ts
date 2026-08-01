import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const POST = auth(async (req) => {
  if (!req.auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.notification.updateMany({
      where: { 
        userId: req.auth.user.id,
        isRead: false 
      },
      data: { isRead: true },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return NextResponse.json({ error: "Failed to mark all read" }, { status: 500 });
  }
});
