"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ADMIN_PASSKEY } from "@/constants";
import { encryptKey } from "@/lib/utils";

import { useState } from "react";
import { useNavigate } from "react-router";

type PasskeyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PasskeyModal = ({ open, onOpenChange }: PasskeyModalProps) => {
  const navigate = useNavigate();
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const closeModal = () => {
    setPasskey("");
    setError("");
    setLoading(false);
    onOpenChange(false);
  };

  const validatePasskey = () => {
    setLoading(true);
    setError("");

    if (passkey === ADMIN_PASSKEY) {
      const encryptedKey = encryptKey(passkey);

      localStorage.setItem("accessKey", encryptedKey);

      closeModal();
      navigate("/users/create");
    } else {
      setError("Invalid passkey. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        closeModal();
        return;
      }

      onOpenChange(nextOpen);
    }}>
      <AlertDialogContent className="space-y-5 bg-gray-900/80 border-gray-700 outline-none text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-start justify-between">
            Admin Access Verification
            <img
              src="/close.svg"
              alt="close"
              width={20}
              height={20}
              onClick={() => closeModal()}
              className="cursor-pointer"
            />
          </AlertDialogTitle>
          <AlertDialogDescription>
            To access the admin privileges, please enter the passkey.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div>
          <InputOTP
            maxLength={6}
            value={passkey}
            onChange={(value) => setPasskey(value)}
          >
            <InputOTPGroup className="w-full flex justify-between">
              <InputOTPSlot
                className="text-36-bold justify-center flex border border-primary rounded-lg size-16 gap-4 text-primary"
                index={0}
                mask
              />
              <InputOTPSlot
                className="text-36-bold justify-center flex border border-primary rounded-lg size-16 gap-4 text-primary"
                index={1}
                mask
              />
              <InputOTPSlot
                className="text-36-bold justify-center flex border border-primary rounded-lg size-16 gap-4 text-primary"
                index={2}
                mask
              />
              <InputOTPSlot
                className="text-36-bold justify-center flex border border-primary rounded-lg size-16 gap-4 text-primary"
                index={3}
                mask
              />
              <InputOTPSlot
                className="text-36-bold justify-center flex border border-primary rounded-lg size-16 gap-4 text-primary"
                index={4}
                mask
              />
              <InputOTPSlot
                className="text-36-bold justify-center flex border border-primary rounded-lg size-16 gap-4 text-primary"
                index={5}
                mask
              />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="shad-error text-14-regular mt-4 flex justify-center">
              {error}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <button
            onClick={validatePasskey}
            disabled={loading}
            className="bg-primary text-gray-900 w-full cursor-pointer hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md font-normal transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-4">
                <img
                  src="/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
                Loading...
              </div>
            ) : (
              "Enter Admin Passkey"
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PasskeyModal;
