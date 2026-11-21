import { cookies } from "next/headers";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The anonymous learner id set by proxy.ts. Anything malformed is treated as anonymous. */
export async function learnerId(): Promise<string> {
  const v = (await cookies()).get("sw_learner")?.value;
  return v && UUID.test(v) ? v : "anonymous";
}
