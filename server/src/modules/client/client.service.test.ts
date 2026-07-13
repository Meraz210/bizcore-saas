import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ClientStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../app/config/prisma.js";
import { ApiError } from "../../app/utils/ApiError.js";
import { ClientService } from "./client.service.js";

type ClientDelegate = {
  create: (args: unknown) => Promise<unknown>;
  findMany: (args: unknown) => Promise<unknown[]>;
  count: (args: unknown) => Promise<number>;
  findFirst: (args: unknown) => Promise<unknown>;
  updateMany: (args: unknown) => Promise<{ count: number }>;
  deleteMany: (args: unknown) => Promise<{ count: number }>;
};

const clientDelegate = prisma.client as unknown as ClientDelegate;
const originalClientDelegate = {
  create: clientDelegate.create,
  findMany: clientDelegate.findMany,
  count: clientDelegate.count,
  findFirst: clientDelegate.findFirst,
  updateMany: clientDelegate.updateMany,
  deleteMany: clientDelegate.deleteMany,
};

afterEach(() => {
  clientDelegate.create = originalClientDelegate.create;
  clientDelegate.findMany = originalClientDelegate.findMany;
  clientDelegate.count = originalClientDelegate.count;
  clientDelegate.findFirst = originalClientDelegate.findFirst;
  clientDelegate.updateMany = originalClientDelegate.updateMany;
  clientDelegate.deleteMany = originalClientDelegate.deleteMany;
});

test("creates client in authenticated organization", async () => {
  clientDelegate.create = async (args) => {
    const createArgs = args as {
      data: unknown;
      select: unknown;
    };

    assert.deepEqual(createArgs.data, {
      name: "Acme Tech",
      email: "hello@acme.test",
      organizationId: "org-a",
      createdById: "user-a",
    });
    assert.equal(typeof createArgs.select, "object");

    return {
      id: "client-a",
      name: "Acme Tech",
      email: "hello@acme.test",
      organizationId: "org-a",
      createdById: "user-a",
      status: ClientStatus.ACTIVE,
    };
  };

  const result = await ClientService.createClient(
    {
      name: "Acme Tech",
      email: "hello@acme.test",
    },
    "org-a",
    "user-a",
  );

  assert.equal((result as { organizationId: string }).organizationId, "org-a");
});

test("searches and paginates clients within tenant", async () => {
  clientDelegate.findMany = async (args) => {
    const findManyArgs = args as {
      where: unknown;
      skip: number;
      take: number;
      orderBy: unknown;
      select: unknown;
    };

    assert.deepEqual(findManyArgs.where, {
      organizationId: "org-a",
      status: ClientStatus.ACTIVE,
      OR: [
        { name: { contains: "tech", mode: "insensitive" } },
        { email: { contains: "tech", mode: "insensitive" } },
        { phone: { contains: "tech", mode: "insensitive" } },
        { companyName: { contains: "tech", mode: "insensitive" } },
      ],
    });
    assert.equal(findManyArgs.skip, 10);
    assert.equal(findManyArgs.take, 10);
    assert.deepEqual(findManyArgs.orderBy, { name: "asc" });
    assert.equal(typeof findManyArgs.select, "object");

    return [{ id: "client-a" }];
  };
  clientDelegate.count = async (args) => {
    assert.deepEqual(args, {
      where: {
        organizationId: "org-a",
        status: ClientStatus.ACTIVE,
        OR: [
          { name: { contains: "tech", mode: "insensitive" } },
          { email: { contains: "tech", mode: "insensitive" } },
          { phone: { contains: "tech", mode: "insensitive" } },
          { companyName: { contains: "tech", mode: "insensitive" } },
        ],
      },
    });

    return 25;
  };

  const result = await ClientService.getClients("org-a", {
    page: 2,
    limit: 10,
    search: "tech",
    status: ClientStatus.ACTIVE,
    sortBy: "name",
    sortOrder: "asc",
  });

  assert.deepEqual(result.meta, {
    page: 2,
    limit: 10,
    total: 25,
    totalPage: 3,
  });
  assert.equal(result.data.length, 1);
});

test("blocks cross-tenant single client access", async () => {
  clientDelegate.findFirst = async (args) => {
    const findFirstArgs = args as {
      where: unknown;
      select: unknown;
    };

    assert.deepEqual(findFirstArgs.where, {
      id: "client-b",
      organizationId: "org-a",
    });
    assert.equal(typeof findFirstArgs.select, "object");

    return null;
  };

  await assert.rejects(
    () => ClientService.getClientById("client-b", "org-a"),
    (error) => error instanceof ApiError && error.statusCode === 404,
  );
});
