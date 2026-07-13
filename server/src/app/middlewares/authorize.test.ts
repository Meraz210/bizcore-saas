import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { MembershipRole } from "../../generated/prisma/enums.js";
import { ApiError } from "../utils/ApiError.js";
import { authorize } from "./authorize.js";

const runAuthorize = (
  allowedRoles: MembershipRole[],
  req: Partial<Request>,
) => {
  let nextCalled = false;
  let nextError: unknown;
  const next: NextFunction = (error?: unknown) => {
    nextCalled = true;
    nextError = error;
  };

  authorize(...allowedRoles)(req as Request, {} as Response, next);

  return { nextCalled, nextError };
};

const buildRequest = (role: MembershipRole): Partial<Request> => ({
  organizationId: "org-a",
  role,
  user: {
    userId: "user-a",
    email: "a@example.com",
    organizationId: "org-a",
    role,
  },
});

test("OWNER can update organization", () => {
  const { nextCalled, nextError } = runAuthorize(
    [MembershipRole.OWNER],
    buildRequest(MembershipRole.OWNER),
  );

  assert.equal(nextCalled, true);
  assert.equal(nextError, undefined);
});

test("ADMIN cannot delete organization", () => {
  const { nextCalled, nextError } = runAuthorize(
    [MembershipRole.OWNER],
    buildRequest(MembershipRole.ADMIN),
  );

  assert.equal(nextCalled, true);
  assert.equal(nextError instanceof ApiError, true);
  assert.equal((nextError as ApiError).statusCode, 403);
});

test("EMPLOYEE cannot invite members", () => {
  const { nextCalled, nextError } = runAuthorize(
    [MembershipRole.OWNER, MembershipRole.ADMIN],
    buildRequest(MembershipRole.EMPLOYEE),
  );

  assert.equal(nextCalled, true);
  assert.equal(nextError instanceof ApiError, true);
  assert.equal((nextError as ApiError).statusCode, 403);
});

test("EMPLOYEE cannot create client", () => {
  const { nextCalled, nextError } = runAuthorize(
    [MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER],
    buildRequest(MembershipRole.EMPLOYEE),
  );

  assert.equal(nextCalled, true);
  assert.equal(nextError instanceof ApiError, true);
  assert.equal((nextError as ApiError).statusCode, 403);
});

test("EMPLOYEE cannot create project", () => {
  const { nextCalled, nextError } = runAuthorize(
    [MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER],
    buildRequest(MembershipRole.EMPLOYEE),
  );

  assert.equal(nextCalled, true);
  assert.equal(nextError instanceof ApiError, true);
  assert.equal((nextError as ApiError).statusCode, 403);
});

test("MANAGER cannot change roles", () => {
  const { nextCalled, nextError } = runAuthorize(
    [MembershipRole.OWNER, MembershipRole.ADMIN],
    buildRequest(MembershipRole.MANAGER),
  );

  assert.equal(nextCalled, true);
  assert.equal(nextError instanceof ApiError, true);
  assert.equal((nextError as ApiError).statusCode, 403);
});
