export interface IUser {
  id: string;
  email: string;
  password: string;
  companyName?: string | null;
  companyLogo?: string | null;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse {
  id: string;
  email: string;
  companyName?: string | null;
  companyLogo?: string | null;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  companyName?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  token: string;
  user: IUserResponse;
}

export interface IJWTPayload {
  userId: string;
  email: string;
}