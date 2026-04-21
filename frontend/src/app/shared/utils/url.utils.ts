export function displayBioLink(url: string | null | undefined): string {
  if (!url) return "";
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function normalizeBioLink(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase();
    const isLocalhost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local");
    const isPrivateIp =
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

    if (!/^https?:$/.test(url.protocol) || isLocalhost || isPrivateIp) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}
