import { mockRequest } from "./client";
import { db } from "./db";

export const featuresApi = {
  list: () => mockRequest(() => db.featureFlags.map((f) => ({ ...f }))),

  toggle: (name: string) =>
    mockRequest(() => {
      const flag = db.featureFlags.find((f) => f.name === name);
      if (flag) flag.enabled = !flag.enabled;
      return db.featureFlags.map((f) => ({ ...f }));
    }),
};
