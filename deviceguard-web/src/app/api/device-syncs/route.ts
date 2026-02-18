import { NextRequest, NextResponse } from "next/server";
import { deviceActivationService } from "@/server/services/deviceActivation.service";
import apiErrorHandler, { ApiError } from "@/utils/handlers/apiError.handler";
import httpStatus from "http-status";
import { z } from "zod";

const createSyncSchema = z.object({
  activationCode: z.string().min(1, "Código requerido"),
  imei: z.string().min(1, "IMEI requerido"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSyncSchema.parse(body);

    const result = await deviceActivationService.activate(
      validatedData.activationCode,
      validatedData.imei
    );

    return NextResponse.json(result, { status: httpStatus.CREATED });
  } catch (error) {
    return apiErrorHandler({ error: error as ApiError, request });
  }
}
