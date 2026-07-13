import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { tenantMiddleware } from "./tenant.middleware.js";

type MembershipFindUnique = (args: unknown) => Promise<unknown>;

const membershipDelegate = prisma.membership as unknown as {
  findUnique: MembershipFindUnique;
};
const originalFindUnique = membershipDelegate.findUnique;

afterEach(() => {
  membershipDelegate.findUnique = originalFindUnique;
});

const runTenantMiddleware = async (req: Partial<Request>) => {
  let nextError: unknown;
  let nextCalled = false;
  const next: NextFunction = (error?: unknown) => {
    nextCalled = true;
    nextError = error;
  };

  await tenantMiddleware(req as Request, {} as Response, next);

  return { nextCalled, nextError };
};

test("rejects cross-tenant organization access before business handlers run", async () => {
  membershipDelegate.findUnique = async (args) => {
    assert.deepEqual(args, {
      where: {
        userId_organizationId: {
          userId: "user-a",
          organizationId: "org-b",
        },
      },
      select: {
        role: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
          },
        },
      },
    });

    return null;
  };

  const { nextCalled, nextError } = await runTenantMiddleware({
    user: {
      userId: "user-a",
      email: "a@example.com",
      organizationId: "org-b",
      role: "MEMBER",
    },
  });

  assert.equal(nextCalled, true);
  assert.equal(nextError instanceof ApiError, true);
  assert.equal((nextError as ApiError).statusCode, 403);
});

test("uses authenticated tenant context instead of client-supplied organizationId", async () => {
  membershipDelegate.findUnique = async () => ({
    role: "OWNER",
    organizationId: "org-a",
    organization: {
      id: "org-a",
    },
  });

  const req: Partial<Request> = {
    body: {
      organizationId: "org-b",
      name: "Client-owned payload",
    },
    user: {
      userId: "user-a",
      email: "a@example.com",
      organizationId: "org-a",
      role: "MEMBER",
    },
  };

  const { nextCalled, nextError } = await runTenantMiddleware(req);

  assert.equal(nextCalled, true);
  assert.equal(nextError, undefined);
  assert.equal(req.organizationId, "org-a");
  assert.equal(req.role, "OWNER");
  assert.equal(req.user?.organizationId, "org-a");
  assert.notEqual(req.organizationId, req.body.organizationId);
});
