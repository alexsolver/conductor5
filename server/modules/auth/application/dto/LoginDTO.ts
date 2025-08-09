
export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  userId: string;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export const createLoginResponse = (
  userId: string,
  token: string,
  refreshToken: string,
  expiresIn: number = 3600
): LoginResponseDTO => ({
  userId,
  token,
  refreshToken,
  expiresIn
});
