import { z } from 'zod';
import {
  insertCustomerSchema,
  insertBorrowingSchema,
  insertSaleSchema,
  insertProductSchema,
  updateProductSchema,
  customers,
  borrowings,
  sales,
  products,
  loginSchema,
  signupSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: loginSchema,
      responses: {
        200: z.object({ success: z.boolean(), username: z.string(), role: z.string(), userId: z.number() }),
        400: errorSchemas.validation,
      }
    },
    signup: {
      method: 'POST' as const,
      path: '/api/signup' as const,
      input: signupSchema,
      responses: {
        201: z.object({ success: z.boolean(), username: z.string() }),
        400: errorSchemas.validation,
      }
    }
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats' as const,
      responses: {
        200: z.object({
          todaySales: z.number(),
          monthSales: z.number(),
          pendingUdhaar: z.number(),
          trustableCount: z.number(),
          riskyCount: z.number(),
        }),
      }
    }
  },
  customers: {
    list: {
      method: 'GET' as const,
      path: '/api/customers' as const,
      responses: {
        200: z.array(z.custom<typeof customers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/customers/:id' as const,
      responses: {
        200: z.custom<typeof customers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/customers' as const,
      input: insertCustomerSchema,
      responses: {
        201: z.custom<typeof customers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/customers/:id' as const,
      input: insertCustomerSchema.partial(),
      responses: {
        200: z.custom<typeof customers.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    }
  },
  borrowings: {
    list: {
      method: 'GET' as const,
      path: '/api/borrowings' as const,
      responses: {
        200: z.array(z.custom<typeof borrowings.$inferSelect & { customerName: string }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/borrowings' as const,
      input: insertBorrowingSchema,
      responses: {
        201: z.custom<typeof borrowings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/borrowings/:id' as const,
      input: z.object({ status: z.enum(["PAID", "PENDING", "OVERDUE"]) }),
      responses: {
        200: z.custom<typeof borrowings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  sales: {
    list: {
      method: 'GET' as const,
      path: '/api/sales' as const,
      responses: {
        200: z.array(z.custom<typeof sales.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sales' as const,
      input: insertSaleSchema,
      responses: {
        201: z.custom<typeof sales.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/sales/:id' as const,
      input: insertSaleSchema.partial(),
      responses: {
        200: z.custom<typeof sales.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/sales/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    }
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products' as const,
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/products/:id' as const,
      input: updateProductSchema,
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
