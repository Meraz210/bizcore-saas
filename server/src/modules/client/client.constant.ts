export const CLIENT_MESSAGES = {
  CREATE_SUCCESS: "Client created successfully",
  GET_ALL_SUCCESS: "Clients retrieved successfully",
  GET_SINGLE_SUCCESS: "Client retrieved successfully",
  UPDATE_SUCCESS: "Client updated successfully",
  DELETE_SUCCESS: "Client deleted successfully",
} as const;

export const CLIENT_SORT_FIELDS = ["name", "companyName", "status", "createdAt", "updatedAt"] as const;
