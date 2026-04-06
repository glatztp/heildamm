export function isEmptyArray<T>(arr: T[] | undefined): boolean {
  return !arr || arr.length === 0;
}

export function isEmptyObject(
  obj: Record<string, unknown> | undefined,
): boolean {
  return !obj || Object.keys(obj).length === 0;
}

export function isValidPath(path: string | undefined): boolean {
  return Boolean(path && path.length > 0);
}

export function isValidNumber(value: number | undefined): boolean {
  return Boolean(value !== undefined && value !== null && !Number.isNaN(value));
}

export function hasData<T>(items: T[]): boolean {
  return items && items.length > 0;
}

export function validateProjectPath(
  projectPath: string | undefined,
): projectPath is string {
  return isValidPath(projectPath);
}
