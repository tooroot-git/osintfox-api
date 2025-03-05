import { fetchWithRetry } from '../utils/safeFetch.js';
async function fetchShodan(query, env) {
  const url = `https://api.shodan.io/shodan/host/${encodeURIComponent(query)}?key=${env.Shodan_API_KEY}`;
  const res = await fetchWithRetry(url, {});
  if (!res.ok) throw new Error(`Shodan API error: ${res.statusText}`);
  return res.json();
}
export { fetchShodan };