export function parseCookies(cookieHeader: string | undefined) {
  const cookies: Record<string, string | undefined> = {};
  if (!cookieHeader) {
    return cookies;
  }
  const cookiesPairs = cookieHeader.split(";");
  for (const segment of cookiesPairs) {
    const pair = segment.trim();
    if (!pair) {
      continue;
    }
    const index_of_equal = pair.indexOf("=");
    const key =
      index_of_equal === -1 ? pair : pair.slice(0, index_of_equal).trim();
    if (!key) {
      continue;
    }
    const value =
      index_of_equal === -1 ? "" : pair.slice(index_of_equal + 1).trim();
    cookies[key] = value;
  }
  return cookies;
}
