import { CreateDataProviderOptions, createDataProvider } from "@refinedev/rest";
import { BACKEND_BASE_URL } from "@/constants";
import { CreateResponse, GetOneResponse, ListResponse } from "@/types";
import { HttpError } from "@refinedev/core";

if (!BACKEND_BASE_URL) {
  throw new Error("BACKEND_BASE_URL is not defined");
}

const buildHttpError = async (response: Response): Promise<HttpError> => {
  let message = "Request failed.";

  try {
    const payload = (await response.json()) as { message?: string; error?: string };

    if (payload?.message) {
      message = payload.message;
    } else if (payload?.error) {
      message = payload.error;
    }
  } catch (e) {
    console.error("Failed to parse error response:", e);
    // Ignore errors
  }

  return {
    message,
    statusCode: response.status,
  };
};

const parseJsonSafely = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    throw {
      message: `Expected JSON response but received '${
        contentType || "unknown"
      }' from ${response.url}`,
      statusCode: response.status,
    } as HttpError;
  }

  return response.json() as Promise<T>;
};

const options: CreateDataProviderOptions = {
  getList: {
    getEndpoint: ({ resource }) => resource,

    buildQueryParams: async ({ resource, pagination, filters }) => {
      const params: Record<string, string | number> = {};

      if (pagination?.mode !== "off") {
        const page = pagination?.currentPage ?? 1;
        const pageSize = pagination?.pageSize ?? 10;
        params.page = page;
        params.limit = pageSize;
      }

      filters?.forEach((filter) => {
        const field = "field" in filter ? filter.field : "";

        if (filter.value == null) return;

        const value = String(filter.value);

        if (field === "role") {
          params.role = value;
        }

        if (resource === "classes") {
          if (field === "name" || field === "code") params.search = value;
          if (field === "subject.id") params.subject = value;
          if (field === "teacher.id") params.teacher = value;
        }

        if (resource === "students") {
          if (
            field === "search" ||
            field === "name" ||
            field === "firstName" ||
            field === "lastName" ||
            field === "registrationNumber"
          ) {
            params.search = value;
          }
          if (field === "classId") params.classId = value;
          if (field === "academicYearId") params.academicYearId = value;
          if (field === "parentId") params.parentId = value;
        }

        if (resource === "student-class-enrollments/overview") {
          if (field === "enrollmentId") params.enrollmentId = value;
          if (field === "classId") params.classId = value;
          if (field === "className") params.className = value;
          if (field === "studentName") params.studentName = value;
          if (field === "academicYearId") params.academicYearId = value;
          if (field === "termId") params.termId = value;
        }

        if (resource === "fees") {
          if (field === "search" || field === "name") params.search = value;
          if (field === "feeType") params.feeType = value;
          if (field === "academicYearId") params.academicYearId = value;
          if (field === "applicableToLevel") params.applicableToLevel = value;
        }

        if (resource === "subjects") {
          if (field === "search" || field === "name") params.search = value;
          if (field === "code") params.code = value;
        }

        if (resource === "staff") {
          if (
            field === "search" ||
            field === "name" ||
            field === "firstName" ||
            field === "lastName" ||
            field === "email" ||
            field === "phone"
          ) {
            params.search = value;
          }
          if (field === "staffType") params.staffType = value;
          if (field === "isActive") params.isActive = value;
          if (field === "subjectId") params.subjectId = value;
        }
      });

      return params;
    },

    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response);

      const payload: ListResponse = await parseJsonSafely<ListResponse>(
        response.clone(),
      );

      return payload.data ?? [];
    },

    getTotalCount: async (response) => {
      if (!response.ok) throw await buildHttpError(response);

      const payload: ListResponse = await parseJsonSafely<ListResponse>(
        response.clone(),
      );

      return payload.pagination?.total ?? payload.data?.length ?? 0;
    },
  },

  create: {
    getEndpoint: ({ resource }) => resource,
    buildBodyParams: ({ variables }) => variables,
    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response);

      const json: CreateResponse = await parseJsonSafely<CreateResponse>(
        response,
      );

      if (!json.data) {
        throw {
          message: "Create response did not include a record payload.",
          statusCode: response.status,
        } as HttpError;
      }

      return json.data;
    },
    transformError: async (response) => buildHttpError(response),
  },

  update: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    getRequestMethod: () => "put",
    buildBodyParams: ({ variables }) => variables,
    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response);

      const json: CreateResponse = await parseJsonSafely<CreateResponse>(
        response,
      );

      return json.data ?? {};
    },
    transformError: async (response) => buildHttpError(response),
  },

  deleteOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response);

      return {};
    },
    transformError: async (response) => buildHttpError(response),
  },

  getOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response);

      const json: GetOneResponse = await parseJsonSafely<GetOneResponse>(
        response,
      );

      return json.data ?? null;
    },
  },
  // getApiUrl: () => "",
  // // optional methods
  // getMany: ({ resource, ids, meta }) => Promise,
  // createMany: ({ resource, variables, meta }) => Promise,
  // deleteMany: ({ resource, ids, variables, meta }) => Promise,
  // updateMany: ({ resource, ids, variables, meta }) => Promise,
  // custom: ({ url, method, filters, sorters, payload, query, headers, meta }) =>
  //   Promise,
};

const { dataProvider } = createDataProvider(BACKEND_BASE_URL, options);

export { dataProvider };
