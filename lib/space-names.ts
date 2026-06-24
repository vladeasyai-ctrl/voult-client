export function suggestUniqueSpaceName(baseName: string, existingNames: string[]): string {
  const taken = new Set(existingNames.map((name) => name.toLowerCase()));
  if (!taken.has(baseName.toLowerCase())) return baseName;

  let index = 2;
  while (taken.has(`${baseName} ${index}`.toLowerCase())) {
    index += 1;
  }
  return `${baseName} ${index}`;
}
