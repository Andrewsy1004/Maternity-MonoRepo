import apiMaternity from '../../api/apiMaternity';

export interface LoginRequest {
  codigo_gmi: string;
  respuesta_seguridad: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
}

export const loginService = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response = await apiMaternity.post<LoginResponse>('/auth/login', data);

  return response.data;
};
