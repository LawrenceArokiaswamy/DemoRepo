import { ClaudeProvider } from "./claude";
import { OfflineProvider } from "./offline";
import type { AIProvider } from "./provider";

export * from "./provider";

let cached: AIProvider | null = null;

/** Claude when a key is configured; otherwise the offline demo provider. */
export function getProvider(): AIProvider {
  if (!cached) {
    cached = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? new ClaudeProvider() : new OfflineProvider();
  }
  return cached;
}

export function setProvider(p: AIProvider) {
  cached = p;
}
