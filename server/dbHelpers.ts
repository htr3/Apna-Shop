import { db } from "./db";

// Insert helper that ensures mobileNo is present and relaxes strict insert typing by casting to any.
// Use when inserting tenant-scoped tables where `mobileNo` must be provided but the caller may not have it.
export function insertWithMobile(table: any, values: any) {
  const withMobile = { mobileNo: values?.mobileNo ?? process.env.DEFAULT_MOBILE_NO ?? "0", ...values };
  return (db as any).insert(table).values(withMobile as any);
}

