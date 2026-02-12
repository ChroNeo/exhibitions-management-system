import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizerUsers,
  createOrganizerUser,
  updateUserRole,
  deleteOrganizerUserApi,
} from "../../../api/adminApi";
import type { CreateUserPayload } from "../../../types/admin";

const QUERY_KEY = ["admin", "users"];

export function useAdminUsers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getOrganizerUsers,
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => createOrganizerUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: "admin" | "organizer" }) =>
      updateUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => deleteOrganizerUserApi(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
