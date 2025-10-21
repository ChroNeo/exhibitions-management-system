import { useMutation } from "@tanstack/react-query";
import { signIn, type SignInPayload, type SignInResponse } from "../api/auth";

export function useSignIn() {
  return useMutation<SignInResponse, Error, SignInPayload>({
    mutationFn: (payload) => signIn(payload),
  });
}
