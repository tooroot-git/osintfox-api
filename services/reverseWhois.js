import { fetchWithRetry } from '../utils/safeFetch.js';
async function fetchReverseWhois(query, env) {
  const url = "https://reverse-whois.whoisxmlapi.com/api/v2";
  const body = {
    apiKey: env.WhoisXML_API_KEY,
    searchType: "current",
    mode: "purchase",
    punycode: true,
    basicSearchTerms: { include: [query] }
  };
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
  const res = await fetchWithRetry(url, init);
  if (!res.ok) throw new Error(`Reverse Whois API error: ${res.statusText}`);
  return res.json();
}
export { fetchReverseWhois };