import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/server/services/admin.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole } from "@/utils/auth.middleware";
import { createAdminSchema } from "@/schemas/admin.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const validatedData = createAdminSchema.parse(body);

    const admin = await adminService.create({
      ...validatedData,
      superAdminId: payload.superAdminId!,
    });

    return NextResponse.json(admin, { status: httpStatus.CREATED });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = requireRole(request, [UserRole.SUPER_ADMIN]);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const admins = await adminService.findBySuperAdminId(
      payload.superAdminId!,
      search
    );

    return NextResponse.json(admins, { status: httpStatus.OK });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
