import { mockRequest } from "./client";
import { db } from "./db";

export const localeApi = {
  getCurrencies: () => mockRequest(() => db.currencies.map((c) => ({ ...c }))),
  getRegions: () => mockRequest(() => db.regions.map((r) => ({ ...r }))),
};
