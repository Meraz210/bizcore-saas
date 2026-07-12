import type { JwtPayload } from "../app/utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      organizationId?: string;
      membership?: {
        id: string;
        role: string;
      };
    }
  }
}

export {};
