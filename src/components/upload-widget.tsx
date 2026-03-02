import {
  BACKEND_BASE_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "@/constants";
import { UploadWidgetValue } from "@/types";
import { UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const UploadWidget = ({
  value = null,
  onChange,
  disabled = false,
}: {
  value: UploadWidgetValue | null;
  onChange: (value: UploadWidgetValue | null) => void;
  disabled?: boolean;
}) => {
  const widgetRef = useRef<CloudinaryWidget | null>(null);
  const onChangeRef = useRef(onChange);

  const [preview, setPreview] = useState<UploadWidgetValue | null>(value);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    setPreview(value);
    if (!value) setPublicId(null);
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeWidget = () => {
      if (!window.cloudinary || widgetRef.current) return false;

      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloud_name: CLOUDINARY_CLOUD_NAME,
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
          multiple: false,
          folder: "uploads",
          maxFileSize: 5 * 1024 * 1024, // 5MB
          clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
          sources: ["local", "url", "camera", "google_drive", "dropbox"],
          return_delete_token: true,
        },
        (error, result) => {
          if (!error && result.event === "success") {
            const payload: UploadWidgetValue = {
              url: result.info.secure_url,
              publicId: result.info.public_id,
            };

            setPreview(payload);
            setPublicId(result.info.public_id);
            onChangeRef.current?.(payload);
          }
        },
      );

      return true;
    };

    if (initializeWidget()) return;

    const intervalId = window.setInterval(() => {
      if (initializeWidget()) {
        window.clearInterval(intervalId);
      }
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [publicId]);

  const openWidget = () => {
    if (!disabled) widgetRef.current?.open();
  };

  const removeFromCloudinary = async () => {
    if (publicId && !isRemoving) {
      try {
        setIsRemoving(true);

        const response = await fetch(`${BACKEND_BASE_URL}cloudinary/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publicId }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete image from Cloudinary");
        }

        setPublicId(null);
        setPreview(null);
        onChangeRef.current?.(null);
      } catch (error) {
        console.error("Error deleting image:", error);
      } finally {
        setIsRemoving(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="upload-preview">
          <img
            src={preview.url}
            alt="Uploaded file"
            className="uploaded-image"
          />
          {!isRemoving && (
            <button
              type="button"
              onClick={removeFromCloudinary}
              aria-label="Remove uploaded image"
              disabled={isRemoving}
            >
              x
            </button>
          )}
        
          {isRemoving && <span>Removing image...</span>}
        </div>
      ) : (
        <div
          className="upload-dropzone"
          role="button"
          tabIndex={0}
          onClick={openWidget}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              openWidget();
            }
          }}
        >
          <div className="upload-prompt">
            <UploadCloud className="icon" />
            <div>
              <p>Click to upload photo</p>
              <p>PNG, JPG, JPEG up to 5MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadWidget;
