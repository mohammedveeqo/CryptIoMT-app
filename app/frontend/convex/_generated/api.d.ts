/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as alerts from "../alerts.js";
import type * as audit from "../audit.js";
import type * as compliance from "../compliance.js";
import type * as crons from "../crons.js";
import type * as cves from "../cves.js";
import type * as equipment from "../equipment.js";
import type * as groups from "../groups.js";
import type * as medicalDevices from "../medicalDevices.js";
import type * as myFunctions from "../myFunctions.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as reports from "../reports.js";
import type * as search from "../search.js";
import type * as types from "../types.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  alerts: typeof alerts;
  audit: typeof audit;
  compliance: typeof compliance;
  crons: typeof crons;
  cves: typeof cves;
  equipment: typeof equipment;
  groups: typeof groups;
  medicalDevices: typeof medicalDevices;
  myFunctions: typeof myFunctions;
  notifications: typeof notifications;
  organizations: typeof organizations;
  reports: typeof reports;
  search: typeof search;
  types: typeof types;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
