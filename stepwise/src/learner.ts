import { cookies } from "next/headers";

export async function learnerId(): Promise<string> {
  return (await cookies()).get("sw_learner")?.value ?? "anonymous";
}
