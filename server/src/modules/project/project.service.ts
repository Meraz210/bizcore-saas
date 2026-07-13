import { prisma } from "../../app/config/prisma.js";
import { ApiError } from "../../app/utils/ApiError.js";
import { ProjectMemberRole } from "../../generated/prisma/enums.js";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  AssignProjectMemberPayload,
  CreateProjectPayload,
  ProjectQuery,
  UpdateProjectPayload,
} from "./project.interface.js";

const projectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  organizationId: true,
  clientId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      name: true,
      companyName: true,
      status: true,
    },
  },
} satisfies Prisma.ProjectSelect;

const projectMemberSelect = {
  id: true,
  projectId: true,
  userId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ProjectMemberSelect;

const ensureClientBelongsToOrganization = async (clientId: string, organizationId: string) => {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId,
    },
    select: { id: true },
  });

  if (!client) {
    throw new ApiError(400, "Client does not belong to this organization");
  }
};

const ensureUserBelongsToOrganization = async (userId: string, organizationId: string) => {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    throw new ApiError(400, "User does not belong to this organization");
  }
};

const getProjectById = async (id: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: {
      id,
      organizationId,
    },
    select: projectSelect,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

const createProject = async (
  payload: CreateProjectPayload,
  organizationId: string,
  createdById: string,
) => {
  if (payload.clientId) {
    await ensureClientBelongsToOrganization(payload.clientId, organizationId);
  }

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        ...payload,
        organizationId,
        createdById,
      },
      select: projectSelect,
    });

    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId: createdById,
        role: ProjectMemberRole.MANAGER,
      },
    });

    return project;
  });
};

const buildProjectWhere = (organizationId: string, query: ProjectQuery) => {
  const where: Prisma.ProjectWhereInput = {
    organizationId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.clientId) {
    where.clientId = query.clientId;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
};

const getProjects = async (organizationId: string, query: ProjectQuery) => {
  if (query.clientId) {
    await ensureClientBelongsToOrganization(query.clientId, organizationId);
  }

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const where = buildProjectWhere(organizationId, query);

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      select: projectSelect,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: projects,
  };
};

const updateProject = async (
  id: string,
  organizationId: string,
  payload: UpdateProjectPayload,
) => {
  if (payload.clientId) {
    await ensureClientBelongsToOrganization(payload.clientId, organizationId);
  }

  const updateResult = await prisma.project.updateMany({
    where: {
      id,
      organizationId,
    },
    data: payload,
  });

  if (updateResult.count === 0) {
    throw new ApiError(404, "Project not found");
  }

  return getProjectById(id, organizationId);
};

const deleteProject = async (id: string, organizationId: string) => {
  const deleteResult = await prisma.project.deleteMany({
    where: {
      id,
      organizationId,
    },
  });

  if (deleteResult.count === 0) {
    throw new ApiError(404, "Project not found");
  }

  return null;
};

const assignMember = async (
  projectId: string,
  organizationId: string,
  payload: AssignProjectMemberPayload,
) => {
  await getProjectById(projectId, organizationId);
  await ensureUserBelongsToOrganization(payload.userId, organizationId);

  try {
    return await prisma.projectMember.create({
      data: {
        projectId,
        userId: payload.userId,
        role: payload.role || ProjectMemberRole.MEMBER,
      },
      select: projectMemberSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "User is already assigned to this project");
    }

    throw error;
  }
};

const getMembers = async (projectId: string, organizationId: string) => {
  await getProjectById(projectId, organizationId);

  return prisma.projectMember.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: projectMemberSelect,
  });
};

const removeMember = async (
  projectId: string,
  memberId: string,
  organizationId: string,
) => {
  const deleteResult = await prisma.projectMember.deleteMany({
    where: {
      id: memberId,
      project: {
        id: projectId,
        organizationId,
      },
    },
  });

  if (deleteResult.count === 0) {
    throw new ApiError(404, "Project member not found");
  }

  return null;
};

export const ProjectService = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  assignMember,
  getMembers,
  removeMember,
};
