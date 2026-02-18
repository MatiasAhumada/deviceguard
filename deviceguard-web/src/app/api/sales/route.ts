import { NextRequest, NextResponse } from "next/server";
import { saleService } from "@/server/services/sale.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import { requireRole } from "@/utils/auth.middleware";
import { createSaleSchema } from "@/schemas/sale.schema";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    requireRole(request, [UserRole.ADMIN]);
    const body = await request.json();

    const validatedData = createSaleSchema.parse(body);

    const sale = await saleService.create(validatedData);

    return NextResponse.json(sale, { status: httpStatus.CREATED });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
