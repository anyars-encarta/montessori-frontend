import { useEffect, useState } from "react";
import { Navigate } from "react-router";

import PageLoader from "@/components/PageLoader";
import { SignUpForm } from "@/components/refine-ui/form/sign-up-form";
import { ADMIN_PASSKEY } from "@/constants";
import { authClient } from "@/lib/auth-client";
import { decryptKey } from "@/lib/utils";

type SessionResponse = {
  data?: {
    user?: unknown;
  } | null;
};

const hasValidStoredPasskey = (consumeOnSuccess = false) => {
  if (typeof window === "undefined") {
    return false;
  }

  const encryptedKey = window.localStorage.getItem("accessKey");
  if (!encryptedKey) {
    return false;
  }

  try {
    const isValid = decryptKey(encryptedKey) === ADMIN_PASSKEY;

    if (isValid && consumeOnSuccess) {
      window.localStorage.removeItem("accessKey");
    }

    return isValid;
  } catch {
    window.localStorage.removeItem("accessKey");
    return false;
  }
};

const CreateUser = () => {
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      const hasPasskeyAccess = hasValidStoredPasskey(true);

      try {
        const session = (await authClient.getSession()) as SessionResponse;
        const isAuthenticated = Boolean(session?.data?.user);

        if (isMounted) {
          setHasAccess(hasPasskeyAccess || isAuthenticated);
          setIsCheckingAccess(false);
        }
      } catch {
        if (isMounted) {
          setHasAccess(hasPasskeyAccess);
          setIsCheckingAccess(false);
        }
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingAccess) {
    return <PageLoader />;
  }

  if (!hasAccess) {
    return <Navigate to="/login" replace />;
  }

  return <SignUpForm />;
};

export default CreateUser;