import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/server/services/admin.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole } from "@/utils/auth.middleware";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.SUPER_ADMIN]);
    const stats = await adminService.getStats(payload.superAdminId!);

    return NextResponse.json(stats, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
