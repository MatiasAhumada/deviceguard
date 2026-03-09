import { z } from "zod";

export const registerFCMTokenSchema = z.object({
  imei: z.string().min(1, "El IMEI es requerido"),
  fcmToken: z.string().min(1, "El token FCM es requerido"),
  deviceId: z.string().optional(), // Opcional: se puede enviar el deviceId si se conoce
});

export type RegisterFCMTokenDto = z.infer<typeof registerFCMTokenSchema>;
