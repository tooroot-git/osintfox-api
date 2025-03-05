import { fetchWithRetry } from '../utils/safeFetch.js';
async function fetchWhoisXML(endpoint, queryParam, env) {
  const url = `https://${endpoint}.whoisxmlapi.com/api/v1?apiKey=${env.WhoisXML_API_KEY}&${queryParam}`;
  const res = await fetchWithRetry(url, {});
  if (!res.ok) throw new Error(`WhoisXML ${endpoint} error: ${res.statusText}`);
  return res.json();
}
async function fetchWhois(domain, env) {
  const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${env.WhoisXML_API_KEY}&domainName=${encodeURIComponent(domain)}&outputFormat=json`;
  const res = await fetchWithRetry(url, {});
  if (!res.ok) throw new Error(`Whois API error: ${res.statusText}`);
  return res.json();
}
export { fetchWhoisXML, fetchWhois };