import type { MembershipRole } from "../generated/prisma/enums.js";
import type { JwtPayload } from "../app/utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      organizationId?: string;
      role?: MembershipRole;
    }
  }
}

export {};
