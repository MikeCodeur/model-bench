import "server-only";
import {
  getAttemptFileService,
  getAttemptLogService,
  getAttemptService,
  listAttemptFilesService,
} from "@/services/attempt-service";
import type { AttemptRef } from "@/services/types/domain/attempt-types";
import { requestDal } from "./request";

export const getAttemptDal = requestDal((ref: AttemptRef) => getAttemptService(ref));
export const getAttemptLogDal = requestDal((ref: AttemptRef) => getAttemptLogService(ref));
export const listAttemptFilesDal = requestDal((ref: AttemptRef) => listAttemptFilesService(ref));
export const getAttemptFileDal = requestDal((ref: AttemptRef, path: string) => getAttemptFileService({ ...ref, path }));
