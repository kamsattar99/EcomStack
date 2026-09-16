/** Stored settings copied at publication must never override runtime environment. */
export function withRuntimeEnvironment<T extends object>(settings: T, environment = process.env.NODE_ENV) {
  return { ...settings, development: environment !== "production" };
}