import { fetchWithRetry } from '../utils/safeFetch.js';
import { API_KEYS } from '../config.js';

async function fetchHunter(query, type, env) {
  const endpoint = (type === "email") ? "email-verifier" : "domain-search";
  const param = (type === "email")
    ? `email=${encodeURIComponent(query)}`
    : `domain=${encodeURIComponent(query)}`;
  const url = `https://api.hunter.io/v2/${endpoint}?api_key=${API_KEYS.hunter}&${param}`;
  const res = await fetchWithRetry(url, {});
  if (!res.ok) throw new Error(`Hunter.io error: ${res.statusText}`);
  return res.json();
}

export { fetchHunter };