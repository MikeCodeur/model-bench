export type ModelBilling = "subscription" | "api";

export type Model = {
  id: string;
  label: string;
  modelId: string | null;
  billing: ModelBilling;
  command: string;
};
