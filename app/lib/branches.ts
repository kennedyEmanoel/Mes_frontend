export const BRANCH_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Barueri" },
  { value: "2", label: "Santa Rita do Sapucaí" },
  { value: "3", label: "Belo Horizonte" },
];

export function branchName(branchId: number | null): string {
  return BRANCH_OPTIONS.find((option) => option.value === String(branchId))?.label ?? "-";
}
