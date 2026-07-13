import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ProjectMemberRole, ProjectStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../app/config/prisma.js";
import { ApiError } from "../../app/utils/ApiError.js";
import { ProjectService } from "./project.service.js";

type Delegate = Record<string, (...args: unknown[]) => Promise<unknown>>;

const projectDelegate = prisma.project as unknown as Delegate;
const clientDelegate = prisma.client as unknown as Delegate;
const membershipDelegate = prisma.membership as unknown as Delegate;
const projectMemberDelegate = prisma.projectMember as unknown as Delegate;
const originalDelegates = {
  projectCreate: projectDelegate.create,
  projectFindFirst: projectDelegate.findFirst,
  projectFindMany: projectDelegate.findMany,
  projectCount: projectDelegate.count,
  projectUpdateMany: projectDelegate.updateMany,
  projectDeleteMany: projectDelegate.deleteMany,
  clientFindFirst: clientDelegate.findFirst,
  membershipFindUnique: membershipDelegate.findUnique,
  projectMemberCreate: projectMemberDelegate.create,
  projectMemberDeleteMany: projectMemberDelegate.deleteMany,
};
const originalTransaction = prisma.$transaction;

afterEach(() => {
  projectDelegate.create = originalDelegates.projectCreate;
  projectDelegate.findFirst = originalDelegates.projectFindFirst;
  projectDelegate.findMany = originalDelegates.projectFindMany;
  projectDelegate.count = originalDelegates.projectCount;
  projectDelegate.updateMany = originalDelegates.projectUpdateMany;
  projectDelegate.deleteMany = originalDelegates.projectDeleteMany;
  clientDelegate.findFirst = originalDelegates.clientFindFirst;
  membershipDelegate.findUnique = originalDelegates.membershipFindUnique;
  projectMemberDelegate.create = originalDelegates.projectMemberCreate;
  projectMemberDelegate.deleteMany = originalDelegates.projectMemberDeleteMany;
  prisma.$transaction = originalTransaction;
});

test("creates project for a tenant client and assigns creator", async () => {
  clientDelegate.findFirst = async (args) => {
    assert.deepEqual(args, {
      where: {
        id: "client-a",
        organizationId: "org-a",
      },
      select: { id: true },
    });
    return { id: "client-a" };
  };

  prisma.$transaction = (async (handler: (tx: typeof prisma) => Promise<unknown>) => {
    return handler(prisma);
  }) as unknown as typeof prisma.$transaction;

  projectDelegate.create = async (args) => {
    const createArgs = args as { data: Record<string, unknown>; select: unknown };
    assert.equal(createArgs.data.organizationId, "org-a");
    assert.equal(createArgs.data.createdById, "user-a");
    assert.equal(createArgs.data.clientId, "client-a");
    assert.equal(typeof createArgs.select, "object");
    return {
      id: "project-a",
      name: "Website redesign",
      status: ProjectStatus.PLANNED,
      organizationId: "org-a",
      clientId: "client-a",
      createdById: "user-a",
    };
  };

  projectMemberDelegate.create = async (args) => {
    assert.deepEqual(args, {
      data: {
        projectId: "project-a",
        userId: "user-a",
        role: ProjectMemberRole.MANAGER,
      },
    });
    return { id: "member-a" };
  };

  const result = await ProjectService.createProject(
    {
      name: "Website redesign",
      clientId: "client-a",
    },
    "org-a",
    "user-a",
  );

  assert.equal((result as { organizationId: string }).organizationId, "org-a");
});

test("assigns project member only when user belongs to organization", async () => {
  projectDelegate.findFirst = async () => ({ id: "project-a" });
  membershipDelegate.findUnique = async (args) => {
    assert.deepEqual(args, {
      where: {
        userId_organizationId: {
          userId: "user-b",
          organizationId: "org-a",
        },
      },
      select: { id: true },
    });
    return { id: "membership-b" };
  };
  projectMemberDelegate.create = async (args) => {
    const createArgs = args as { data: Record<string, unknown>; select: unknown };
    assert.deepEqual(createArgs.data, {
      projectId: "project-a",
      userId: "user-b",
      role: ProjectMemberRole.MEMBER,
    });
    assert.equal(typeof createArgs.select, "object");
    return { id: "project-member-b" };
  };

  const result = await ProjectService.assignMember("project-a", "org-a", {
    userId: "user-b",
  });

  assert.equal((result as { id: string }).id, "project-member-b");
});

test("updates project with tenant-scoped write", async () => {
  projectDelegate.updateMany = async (args) => {
    assert.deepEqual(args, {
      where: {
        id: "project-a",
        organizationId: "org-a",
      },
      data: {
        status: ProjectStatus.IN_PROGRESS,
      },
    });
    return { count: 1 };
  };
  projectDelegate.findFirst = async () => ({ id: "project-a", status: ProjectStatus.IN_PROGRESS });

  const result = await ProjectService.updateProject("project-a", "org-a", {
    status: ProjectStatus.IN_PROGRESS,
  });

  assert.equal((result as { status: ProjectStatus }).status, ProjectStatus.IN_PROGRESS);
});

test("deletes project with tenant-scoped write", async () => {
  projectDelegate.deleteMany = async (args) => {
    assert.deepEqual(args, {
      where: {
        id: "project-a",
        organizationId: "org-a",
      },
    });
    return { count: 1 };
  };

  const result = await ProjectService.deleteProject("project-a", "org-a");

  assert.equal(result, null);
});

test("blocks cross-tenant project access", async () => {
  projectDelegate.findFirst = async (args) => {
    assert.deepEqual((args as { where: unknown }).where, {
      id: "project-b",
      organizationId: "org-a",
    });
    return null;
  };

  await assert.rejects(
    () => ProjectService.getProjectById("project-b", "org-a"),
    (error) => error instanceof ApiError && error.statusCode === 404,
  );
});
