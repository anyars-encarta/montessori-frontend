import { SchoolDetailsRecord } from "@/types";
import { useList } from "@refinedev/core";
import PageLoader from "./PageLoader";

const RenderLogo = () => {
  const { query: schoolQuery, result: schoolResult } =
    useList<SchoolDetailsRecord>({
      resource: "school-details",
      pagination: { pageSize: 50 },
    });

  const school = schoolResult.data[0] ?? null;

  if (schoolQuery.isLoading) {
    return (
      <PageLoader />
    );
  }

  return (
    <>
      {school.logo ? (
        <img
          src={school.logo}
          alt={school.name}
          className="h-10 w-10 rounded-sm object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center text-muted-foreground">
          No Logo
        </div>
      )}
    </>
  );
};

export default RenderLogo;
