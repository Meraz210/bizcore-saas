import { prisma } from "../../app/config/prisma.js";
import { AppError } from "../../app/errors/AppError.js";
import type { UpdateOrganizationPayload } from "./organization.interface.js";

const getCurrent = async (organizationId: string) => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new AppError(404, "Organization not found");
  }

  return organization;
};

const updateCurrent = async (
  organizationId: string,
  payload: UpdateOrganizationPayload,
) => {
  await getCurrent(organizationId);

  return prisma.organization.update({
    where: { id: organizationId },
    data: payload,
  });
};

export const OrganizationService = {
  getCurrent,
  updateCurrent,
};
