import { CreateDataProviderOptions, createDataProvider } from "@refinedev/rest";
import { BACKEND_BASE_URL } from "@/constants";
import { CreateResponse, GetOneResponse, ListResponse } from "@/types";
import { HttpError } from "@refinedev/core";

if (!BACKEND_BASE_URL) {
  throw new Error("BACKEND_BASE_URL is not defined");
};

const buildHttpError = async (response: Response): Promise<HttpError> => {
  let message ='Request failed.';

  try {
    const payload = (await response.json() as { message?: string });

    if (payload?.message) message = payload.message;
  } catch (e) {
    console.error("Failed to parse error response:", e);
    // Ignore errors
  };

  return {
    message,
    statusCode: response.status,
  };
}

const options: CreateDataProviderOptions = {
  getList: {
    getEndpoint: ({ resource }) => resource,

    buildQueryParams: async ({ resource, pagination, filters}) => {
      const page = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 10;

      const params: Record<string, string | number> = { page, limit: pageSize };

      filters?.forEach((filter) => {
        const field = 'field' in filter ? filter.field : '';

        if (filter.value == null) return;
        
        const value = String(filter.value)

        if (field === "role") {
          params.role = value;
        }

        // if (resource === "departments") {
        //   if (field === "name" || field === "code") params.search = value;
        // }

        // if (resource === "users") {
        //   if (field === "search" || field === "name" || field === "email") {
        //     params.search = value;
        //   }
        // }
        
        // if (resource === "subjects") {
        //   if (field === "department") params.department = value;
        //   if (field === "name" || field === "code") params.search = value;
        // }

        if (resource === "classes") {
          if (field === "name" || field === "code") params.search = value;
          if (field === "subject.id") params.subject = value;
          if (field === "teacher.id") params.teacher = value;
        }
      });

      return params;
    },

    mapResponse: async (response) => {
      if(!response.ok) throw await buildHttpError(response);

      const payload: ListResponse = await response.clone().json();

      return payload.data ?? [];
    },

    getTotalCount: async(response) => {
      if(!response.ok) throw await buildHttpError(response);

      const payload: ListResponse = await response.clone().json();

      return payload.pagination?.total ?? payload.data?.length ?? 0;
    },
  },

  create: {
    getEndpoint: ({ resource }) => resource,
    buildBodyParams: ({ variables }) => variables,
    mapResponse: async (response) => {
      if(!response.ok) throw await buildHttpError(response);
      
      const json: CreateResponse = await response.json();

      return json.data ?? [];
    },
  },

  update: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    buildBodyParams: ({ variables }) => variables,
    mapResponse: async (response) => {
      if(!response.ok) throw await buildHttpError(response);

      const json: CreateResponse = await response.json();

      return json.data ?? null;
    },
  },
  
  deleteOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    mapResponse: async (response) => {
      if(!response.ok) throw await buildHttpError(response);

      return null;
    },
  },

  getOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    mapResponse: async (response) => {
      if(!response.ok) throw await buildHttpError(response);

      const json: GetOneResponse = await response.json();

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
}

const { dataProvider } = createDataProvider(BACKEND_BASE_URL, options);

export { dataProvider };