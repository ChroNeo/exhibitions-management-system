import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  fetchCertificateTemplate,
  createCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
} from "../api/certificate";
import type {
  CertificateTemplate,
  CreateCertificateTemplatePayload,
  UpdateCertificateTemplatePayload,
} from "../types/certificate";

type QueryOpts = Omit<
  UseQueryOptions<CertificateTemplate | null, Error>,
  "queryKey" | "queryFn"
>;

export function useCertificateTemplate(
  exhibitionId?: string | number,
  opts?: QueryOpts
) {
  return useQuery<CertificateTemplate | null, Error>({
    queryKey: ["certificate-template", exhibitionId],
    queryFn: () => fetchCertificateTemplate(exhibitionId as string | number),
    enabled: !!exhibitionId && (opts?.enabled ?? true),
    ...opts,
  });
}

export function useCreateCertificateTemplate() {
  const queryClient = useQueryClient();

  return useMutation<
    CertificateTemplate,
    Error,
    { exhibitionId: string | number; payload: CreateCertificateTemplatePayload }
  >({
    mutationFn: ({ exhibitionId, payload }) =>
      createCertificateTemplate(exhibitionId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["certificate-template", variables.exhibitionId],
      });
    },
  });
}

export function useUpdateCertificateTemplate() {
  const queryClient = useQueryClient();

  return useMutation<
    CertificateTemplate,
    Error,
    { exhibitionId: string | number; payload: UpdateCertificateTemplatePayload }
  >({
    mutationFn: ({ exhibitionId, payload }) =>
      updateCertificateTemplate(exhibitionId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["certificate-template", variables.exhibitionId],
      });
    },
  });
}

export function useDeleteCertificateTemplate() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string | number>({
    mutationFn: (exhibitionId) => deleteCertificateTemplate(exhibitionId),
    onSuccess: (_data, exhibitionId) => {
      queryClient.invalidateQueries({
        queryKey: ["certificate-template", exhibitionId],
      });
    },
  });
}
