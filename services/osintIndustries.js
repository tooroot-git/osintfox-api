import { fetchWithRetry } from '../utils/safeFetch.js';
async function fetchOSINT(query, type, env) {
  const url = `https://api.osint.industries/v2/request?type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}&timeout=60`;
  const res = await fetchWithRetry(url, {
    headers: { "api-key": env.Osint_Industries_API_KEY }
  });
  if (!res.ok) throw new Error(`OSINT Industries error: ${res.statusText}`);
  return res.json();
}
export { fetchOSINT };