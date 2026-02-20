import fs from "node:fs";
import path from "node:path";

let cachedCoatAssetKeys: Set<string> | null = null;

function loadCoatAssetKeys() {
  if (cachedCoatAssetKeys) {
    return cachedCoatAssetKeys;
  }

  const fallback = new Set<string>(["karlin"]);

  try {
    const coatsDir = path.join(process.cwd(), "public", "coats");
    const files = fs.readdirSync(coatsDir, { withFileTypes: true });
    const keys = new Set(
      files
        .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
        .map((entry) => entry.name.slice(0, -4).toLowerCase()),
    );

    keys.add("karlin");
    cachedCoatAssetKeys = keys;
    return keys;
  } catch {
    cachedCoatAssetKeys = fallback;
    return fallback;
  }
}

export function resolveCoatAssetKey(assetKey: string) {
  const normalized = assetKey.trim().toLowerCase();
  if (!normalized) {
    return "karlin";
  }

  const available = loadCoatAssetKeys();
  return available.has(normalized) ? normalized : "karlin";
}
