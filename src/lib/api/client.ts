// Simulates network latency. When wiring a real backend, remove this and replace
// the functions in each API module with real fetch() / axios calls.
export async function mockRequest<T>(fn: () => T, ms = 120): Promise<T> {
  await new Promise<void>((r) => setTimeout(r, ms));
  return fn();
}
