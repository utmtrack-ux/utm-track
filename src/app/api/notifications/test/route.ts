import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSaleNotification, SaleNotificationType } from "@/lib/notifications/service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const type = (body.type as SaleNotificationType) || "sale_approved";
    const amount = typeof body.amount === "number" ? body.amount : 151.04;
    const platform = body.platform || "Hotmart";
    const product = body.product || "Curso de Escala Meta Ads Pro";

    const testTransactionId = `TEST_${Date.now()}`;

    const result = await createSaleNotification({
      workspaceId: membership.workspaceId,
      userId: session.user.id,
      type,
      amount,
      currency: "BRL",
      platform,
      product,
      transactionId: testTransactionId,
      orderId: `ORD-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      notification: result.notification,
      sound: result.sound,
      soundUrl: `/sounds/${result.sound}.wav`,
      dispatched: result.dispatched,
      devicesTargeted: result.devicesTargeted,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
