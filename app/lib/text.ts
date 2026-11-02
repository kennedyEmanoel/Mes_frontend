// Mesma regra do backend (normalizeText): ignora acentos, maiúsculas e espaços repetidos.
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesSearch(text: string, term: string): boolean {
  const normalizedTerm = normalizeText(term);
  return normalizedTerm === "" || normalizeText(text).includes(normalizedTerm);
}
