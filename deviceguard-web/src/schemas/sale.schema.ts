import { z } from "zod";

export const createSaleSchema = z.object({
  deviceId: z.string().min(1, "El dispositivo es requerido"),
  clientId: z.string().min(1, "El cliente es requerido"),
  totalAmount: z.number().positive("El monto debe ser positivo"),
  installments: z.number().int().min(1, "Mínimo 1 cuota"),
  firstWarningDay: z.number().int().min(1, "Mínimo 1 día"),
  secondWarningDay: z.number().int().min(1, "Mínimo 1 día"),
  blockDay: z.number().int().min(1, "Mínimo 1 día"),
});

export type CreateSaleDto = z.infer<typeof createSaleSchema>;
