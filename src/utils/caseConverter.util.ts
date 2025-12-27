const isUndefined = (a: unknown): a is undefined => typeof a === "undefined";

export const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const toCamelCase = <T>(obj: T): T => {
  if (obj === null || isUndefined(obj)) return obj;

  if (Array.isArray(obj)) return obj.map((item) => toCamelCase(item)) as T;

  if (typeof obj === "object" && obj.constructor === Object)
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);

      (acc as Record<string, unknown>)[camelKey] = toCamelCase(
        (obj as Record<string, unknown>)[key]
      );
      return acc;
    }, {} as T);

  return obj;
};
