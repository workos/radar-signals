/**
 * IIFE entry point for script-tag usage.
 *
 * Assigns the WorkOSRadar class directly to `globalThis.WorkOSRadar`
 * so consumers can write `WorkOSRadar.init(...)` instead of the
 * double-nested `WorkOSRadar.WorkOSRadar.init(...)` that esbuild's
 * `globalName` option produces for named exports.
 */
import { WorkOSRadar } from "./index";

(globalThis as Record<string, unknown>).WorkOSRadar = WorkOSRadar;
