import { z } from "zod";

export const createAdminSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
});

export type CreateAdminDto = z.infer<typeof createAdminSchema>;
