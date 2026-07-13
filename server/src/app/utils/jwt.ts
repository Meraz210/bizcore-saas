import jwt, { type SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export type TokenExpiresIn = SignOptions["expiresIn"];

export const createToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string | number,
) => {
  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.sign(payload, secret, { expiresIn: expiresIn as TokenExpiresIn });
};

export const verifyToken = (token: string, secret: string) => {
  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.verify(token, secret) as JwtPayload;
};
