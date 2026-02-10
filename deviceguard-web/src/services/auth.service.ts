import clientAxios from "@/utils/clientAxios.util";
import {
  LoginDto,
  RegisterDto,
  AuthResponse,
  AuthUser,
} from "@/types/auth.types";
import { API_ROUTES } from "@/constants/routes";

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data } = await clientAxios.post(API_ROUTES.AUTH.SESSION, dto);
    return data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { data } = await clientAxios.post(API_ROUTES.AUTH.REGISTER, dto);
    return data;
  },

  async logout(): Promise<void> {
    await clientAxios.delete(API_ROUTES.AUTH.SESSION);
  },

  async me(): Promise<{ user: AuthUser }> {
    const { data } = await clientAxios.get(API_ROUTES.AUTH.SESSION);
    return data;
  },
};
