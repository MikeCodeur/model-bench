import "server-only";
import { getBenchmarkService, listBenchmarksService } from "@/services/benchmark-service";
import { requestDal } from "./request";

export const listBenchmarksDal = requestDal(listBenchmarksService);
export const getBenchmarkDal = requestDal(getBenchmarkService);
