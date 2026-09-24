import "server-only";
import { getRunService, getRunTestService, listRunsService } from "@/services/run-service";
import { requestDal } from "./request";

export const listRunsDal = requestDal(listRunsService);
export const getRunDal = requestDal((model: string, run: string) => getRunService({ model, run }));
export const getRunTestDal = requestDal((model: string, run: string, test: string) => getRunTestService({ model, run, test }));
