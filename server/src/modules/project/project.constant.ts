export const PROJECT_MESSAGES = {
  CREATE_SUCCESS: "Project created successfully",
  GET_ALL_SUCCESS: "Projects retrieved successfully",
  GET_SINGLE_SUCCESS: "Project retrieved successfully",
  UPDATE_SUCCESS: "Project updated successfully",
  DELETE_SUCCESS: "Project deleted successfully",
  MEMBER_ASSIGN_SUCCESS: "Project member assigned successfully",
  MEMBER_REMOVE_SUCCESS: "Project member removed successfully",
  MEMBER_GET_ALL_SUCCESS: "Project members retrieved successfully",
} as const;

export const PROJECT_SORT_FIELDS = ["name", "status", "startDate", "endDate", "createdAt", "updatedAt"] as const;
