import { prisma } from "../../app/config/prisma.js";
import { ApiError } from "../../app/utils/ApiError.js";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  ClientQuery,
  CreateClientPayload,
  UpdateClientPayload,
} from "./client.interface.js";

const clientSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  companyName: true,
  address: true,
  status: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

const createClient = async (
  payload: CreateClientPayload,
  organizationId: string,
  createdById: string,
) => {
  return prisma.client.create({
    data: {
      ...payload,
      organizationId,
      createdById,
    },
    select: clientSelect,
  });
};

const buildClientWhere = (organizationId: string, query: ClientQuery) => {
  const where: Prisma.ClientWhereInput = {
    organizationId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
      { companyName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
};

const getClients = async (organizationId: string, query: ClientQuery) => {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const where = buildClientWhere(organizationId, query);

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      select: clientSelect,
    }),
    prisma.client.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: clients,
  };
};

const getClientById = async (id: string, organizationId: string) => {
  const client = await prisma.client.findFirst({
    where: {
      id,
      organizationId,
    },
    select: clientSelect,
  });

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  return client;
};

const updateClient = async (
  id: string,
  organizationId: string,
  payload: UpdateClientPayload,
) => {
  const updateResult = await prisma.client.updateMany({
    where: {
      id,
      organizationId,
    },
    data: payload,
  });

  if (updateResult.count === 0) {
    throw new ApiError(404, "Client not found");
  }

  return getClientById(id, organizationId);
};

const deleteClient = async (id: string, organizationId: string) => {
  const deleteResult = await prisma.client.deleteMany({
    where: {
      id,
      organizationId,
    },
  });

  if (deleteResult.count === 0) {
    throw new ApiError(404, "Client not found");
  }

  return null;
};

export const ClientService = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};
