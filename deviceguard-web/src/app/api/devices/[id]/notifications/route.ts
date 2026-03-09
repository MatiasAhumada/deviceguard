import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/auth.middleware";
import { UserRole, NotificationType } from "@prisma/client";
import httpStatus from "http-status";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/services/firebase.service";
import { sendNotificationSchema, SendNotificationDto } from "@/schemas/notification.schema";

/**
 * POST /api/devices/:id/notifications
 * Envía una notificación push a un dispositivo sincronizado
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireRole(request, [UserRole.ADMIN]);
    const { id: deviceId } = await params;
    const body = await request.json();

    // Validar body con schema
    const validatedData = sendNotificationSchema.parse(body);

    // Verificar que el dispositivo existe y pertenece al admin
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        sync: true,
        admin: true,
      },
    });

    if (!device) {
      throw new ApiError({
        status: httpStatus.NOT_FOUND,
        message: "Dispositivo no encontrado",
      });
    }

    if (device.adminId !== payload.adminId) {
      throw new ApiError({
        status: httpStatus.FORBIDDEN,
        message: "No tienes permiso para enviar notificaciones a este dispositivo",
      });
    }

    // Verificar que el dispositivo está sincronizado
    if (!device.sync) {
      throw new ApiError({
        status: httpStatus.BAD_REQUEST,
        message: "El dispositivo no está sincronizado",
      });
    }

    const fcmToken = device.sync.fcmToken;

    // Si hay token FCM, enviar notificación push
    if (fcmToken) {
      await sendPushNotification(fcmToken, {
        title: validatedData.title,
        body: validatedData.message,
        data: {
          deviceId,
          type: validatedData.type,
        },
      });
    }

    // Guardar notificación en la DB
    const notification = await prisma.notification.create({
      data: {
        deviceId,
        installmentId: null, // No asociado a una cuota
        type: validatedData.type,
        message: validatedData.message,
      },
      include: {
        device: true,
      },
    });

    const response: {
      success: boolean;
      notification: typeof notification;
      warning?: string;
    } = {
      success: true,
      notification,
    };

    if (!fcmToken) {
      response.warning = "Dispositivo sin token FCM registrado. Notificación guardada en DB.";
    }

    return NextResponse.json(response, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
