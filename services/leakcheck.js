import { fetchWithRetry } from '../utils/safeFetch.js';
async function fetchLeakcheck(query, type, env) {
  const url = `https://leakcheck.io/api/v2/query/${encodeURIComponent(query)}?type=${encodeURIComponent(type)}`;
  const res = await fetchWithRetry(url, {
    headers: { "X-API-Key": env.LeakCheck_API_KEY }
  });
  if (!res.ok) throw new Error(`LeakCheck error: ${res.statusText}`);
  return res.json();
}
export { fetchLeakcheck };