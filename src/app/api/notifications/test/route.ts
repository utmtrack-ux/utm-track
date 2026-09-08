import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserWorkspaceId } from "@/lib/workspace";
import { dispatchPushToDevices } from "@/lib/notifications/push-dispatcher";

// Rate limiting in memory: max 10 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (userLimit.count >= 10) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Muitas requisições. Aguarde um momento antes de enviar outro teste de notificação." },
        { status: 429 }
      );
    }

    const workspaceId = await getUserWorkspaceId(session.user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace não encontrado" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const customTitle = body.title || "UTM-Track";
    const customMessage =
      body.message || "Notificação de teste recebida com sucesso. Seu aplicativo está configurado corretamente.";
    const sound = body.sound || "som_venda_aprovada";

    // 1. Buscar dispositivos ativos registrados para este workspace / usuário
    const devices = await prisma.device.findMany({
      where: {
        OR: [
          { workspaceId, isActive: true },
          { userId: session.user.id, isActive: true },
        ],
      },
      orderBy: { lastSeenAt: "desc" },
    });

    // 2. Registrar evento de notificação de teste no banco (SEM gerar venda ou efeito financeiro)
    const notification = await prisma.notification.create({
      data: {
        workspaceId,
        userId: session.user.id,
        type: "push_test",
        title: customTitle,
        message: customMessage,
        severity: "info",
        sound,
        pushStatus: devices.length > 0 ? "sent" : "skipped",
        idempotencyKey: `push_test_${session.user.id}_${Date.now()}`,
        metadata: JSON.stringify({
          source: "push_test_engine",
          soundFile: `/sounds/${sound}.wav`,
          deepLink: "/notifications",
          devicesTargeted: devices.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    if (devices.length === 0) {
      return NextResponse.json({
        success: false,
        warning: "Nenhum dispositivo móvel registrado",
        message:
          "Nenhum dispositivo Android/iOS conectado para este usuário. Abra o aplicativo UTM-Track no celular para registrar o dispositivo automaticamente.",
        devicesCount: 0,
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
        },
      });
    }

    // 3. Despachar push real para os dispositivos
    const pushResult = await dispatchPushToDevices({
      notificationId: notification.id,
      workspaceId,
      type: "push_test",
      title: customTitle,
      body: customMessage,
      sound,
    });

    return NextResponse.json({
      success: true,
      message: "Notificação de teste enviada com sucesso para o seu dispositivo.",
      devicesCount: devices.length,
      pushResult: {
        totalTargeted: pushResult.totalTargeted,
        successCount: pushResult.successCount,
        failureCount: pushResult.failureCount,
        prunedTokensCount: pushResult.prunedTokensCount,
        errors: pushResult.errors,
      },
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        sound,
        createdAt: notification.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[Push Test API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno ao processar teste de push" },
      { status: 500 }
    );
  }
}
