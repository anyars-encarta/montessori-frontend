import { createAuthClient } from "better-auth/react";
import { BACKEND_BASE_URL } from "../constants";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: `${BACKEND_BASE_URL}/auth`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        imageCldPubId: { type: "string" },
      },
    }),
  ],
});
