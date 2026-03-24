import { BACKEND_BASE_URL } from "@/constants";
import { SchoolDetailsRecord } from "@/types";
import { useEffect, useState } from "react";

export type SchoolBranding = {
  name: string;
  logo: React.ReactNode;
};

export const useSchoolBranding = (): SchoolBranding => {
  const [school, setSchool] = useState<SchoolDetailsRecord | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_BASE_URL}/school-details`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const record = Array.isArray(data) ? data[0] : data?.data?.[0] ?? null;
        setSchool(record ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLogoLoaded(false);
  }, [school?.logo]);

  const fallbackName = "School";
  const logoUrl = school?.logo?.trim() || "";

  const logoNode = (
    <div className="relative h-10 w-10 overflow-hidden rounded-sm">
      {(!logoUrl || !logoLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-xs text-muted-foreground">
          Logo
        </div>
      )}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={school?.name ?? fallbackName}
          className={`h-10 w-10 rounded-sm object-cover ${
            logoLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLogoLoaded(true)}
          onError={() => setLogoLoaded(false)}
        />
      ) : null}
    </div>
  );

  return {
    name: school?.name?.trim() || fallbackName,
    logo: logoNode,
  };
};

export default useSchoolBranding;
