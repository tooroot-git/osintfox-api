import { fetchWithRetry } from '../utils/safeFetch.js';
import { API_KEYS } from '../config.js';

async function fetchOSINT(query, type, env) {
  const url = `https://api.osint.industries/v2/request?type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}&timeout=60`;
  const res = await fetchWithRetry(url, {
    headers: { "api-key": API_KEYS.osintIndustries }
  });
  if (!res.ok) throw new Error(`OSINT Industries error: ${res.statusText}`);
  return res.json();
}
export { fetchOSINT };