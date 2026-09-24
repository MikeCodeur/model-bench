import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "@/services/errors/service-errors";
import { getRunService, getRunTestService, listRunsService } from "@/services/run-service";

const ref = { model: "opus-5-5", run: "2026-09-23-a" };

describe("run-service", () => {
  it("lists runs with totals over every attempt", async () => {
    const [run] = await listRunsService();
    expect(run).toMatchObject({ ...ref, cliVersion: "2.1.280 (Claude Code)" });
    expect(run.totals).toMatchObject({ tests: 2, finished: 2, delivered: 1, running: 0, outputTokens: 47577 + 21790 });
    expect(run.totals.costUsd).toBeCloseTo(3.1);
  });

  it("shows the latest attempt of each test and keeps iterations", async () => {
    const detail = await getRunService(ref);
    const blackHole = detail.tests.find((test) => test.test === "3d-06-black-hole-lensing");
    expect(blackHole?.attempts.map((attempt) => attempt.number)).toEqual([1, 2]);
    expect(blackHole?.latest).toMatchObject({ number: 2, kind: "iteration", basedOn: 1, status: "ok" });
  });

  it("shows an unfinished attempt as stopped when no runner process is alive", async () => {
    const landing = await getRunTestService({ ...ref, test: "web-01-ai-saas-landing" });
    expect(landing.latest?.status).toBe("running");
    expect(landing.latest?.startedAt).not.toBeNull();
    expect(landing.state).toBe("stopped");
  });

  it("rejects refs that could escape the data folder", async () => {
    await expect(getRunService({ model: "../etc", run: "2026-09-23-a" })).rejects.toBeInstanceOf(ValidationError);
    await expect(getRunTestService({ ...ref, test: "../../x" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("reports missing runs and tests", async () => {
    await expect(getRunService({ model: "opus-5-5", run: "2026-01-01-a" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(getRunTestService({ ...ref, test: "sim-01-wildfire-cellular" })).rejects.toBeInstanceOf(NotFoundError);
  });
});
