import { useQuery } from "@tanstack/react-query";
import { fetchUserOptions } from "../api/users";
import type { UserOption } from "../types/users";

export function useUserOptions(role?: "staff" | "user") {
  return useQuery<UserOption[], Error>({
    queryKey: ["user-options", role ?? "all"],
    queryFn: () => fetchUserOptions(role),
  });
}
