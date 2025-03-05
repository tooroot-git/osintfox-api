import { fetchWhoisXML, fetchWhois } from './services/whoisxml.js';
import { fetchReverseWhois } from './services/reverseWhois.js';
import { fetchShodan } from './services/shodan.js';
import { fetchHunter } from './services/hunter.js';
import { fetchLeakcheck } from './services/leakcheck.js';
import { fetchOSINT } from './services/osintIndustries.js';
import { fetchWithRetry } from './utils/safeFetch.js';
import { putCache } from './utils/cache.js';
import { updateStats } from './utils/logger.js';

export default {
  async fetch(request, env, ctx) {
    try {
      // Parse URL and query parameters
      const url = new URL(request.url);
      const params = new URLSearchParams(url.search);
      const query = params.get("query")?.trim();
      const type = params.get("type")?.trim().toLowerCase();

      if (!query || !type) {
        return new Response(JSON.stringify({ error: "Missing query or type parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await updateStats(env, "requests");

      // Create cache key and check cache
      const cacheKey = `osint:${type}:${query}`;
      const cachedAggregate = await env.OSINT_KV.get(cacheKey, { type: "json" });
      if (cachedAggregate) {
        return new Response(JSON.stringify(cachedAggregate, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Free email domains
      const freeEmailDomains = ["gmail.com", "hotmail.com", "yahoo.com", "outlook.com", "live.com"];

      // Initialize results and tasks
      const results = {
        domainInfo: null,
        breachInfo: null,
        ipInfo: null,
        osintInfo: null,
        hunterInfo: null,
        recommendations: []
      };
      const tasks = [];

      // Define service groups
      const leakCheckParams = ["email", "domain", "username", "phone", "hash", "password"];
      const osintIndustriesParams = ["email", "username", "phone"];
      const whoisParams = ["domain", "ip"];
      const hunterParams = ["email", "domain"];
      const shodanParams = ["ip"];

      // Layer 1: Initial Queries
      if (type === "ip") {
        tasks.push(
          fetchAndCache("reverse_ip", () => fetchWhoisXML("reverse-ip", `ip=${query}`, env))
            .then(data => results.reverseIP = data),
          fetchAndCache("reverse_dns", () => fetchWhoisXML("reverse-dns", `ip=${query}`, env))
            .then(data => results.reverseDNS = data),
          fetchAndCache("shodan", () => fetchShodan(query, env))
            .then(data => results.shodan = data),
          fetchAndCache("ip_geo", () => fetchWhoisXML("ip-geolocation", `ipAddress=${query}`, env))
            .then(data => results.geo = data),
          fetchAndCache("ip_netblocks", () => fetchWhoisXML("ip-netblocks", `ip=${query}`, env))
            .then(data => results.netblocks = data),
          fetchAndCache("threat_intel", () => fetchWhoisXML("threat-intelligence", `ip=${query}`, env))
            .then(data => results.threatIntel = data)
        );
      } else if (type === "domain") {
        tasks.push(
          fetchAndCache("whois", () => fetchWhois(query, env))
            .then(data => results.whois = data),
          fetchAndCache("dns_lookup", () => fetchWhoisXML("dns-lookup", `domainName=${query}`, env))
            .then(data => results.dnsLookup = data),
          fetchAndCache("subdomains", () => fetchWhoisXML("subdomains", `domainName=${query}`, env))
            .then(data => results.subdomains = data),
          fetchAndCache("hunter", () => fetchHunter(query, "domain", env))
            .then(data => results.hunter = data),
          fetchAndCache("leakcheck", () => fetchLeakcheck(query, "domain", env))
            .then(data => results.leakcheck = data),
          fetchAndCache("reverse_whois", () => fetchReverseWhois(query, env))
            .then(data => results.reverseWhois = data),
          fetchAndCache("whois_history", () => fetchWhoisXML("whois-history", `domainName=${query}`, env))
            .then(data => results.whoisHistory = data),
          fetchAndCache("dns_chronicle", () => fetchWhoisXML("dns-history", `domainName=${query}`, env))
            .then(data => results.dnsChronicle = data)
        );
      } else if (type === "email") {
        const emailDomain = query.split("@")[1]?.toLowerCase();
        tasks.push(
          fetchAndCache("leakcheck", () => fetchLeakcheck(query, "email", env))
            .then(data => results.leakcheck = data),
          fetchAndCache("osint", () => fetchOSINT(query, "email", env))
            .then(data => results.osint = data),
          fetchAndCache("reverse_whois", () => fetchReverseWhois(query, env))
            .then(data => results.reverseWhois = data)
        );
        if (emailDomain && !freeEmailDomains.includes(emailDomain)) {
          tasks.push(
            fetchAndCache("hunter", () => fetchHunter(query, "email", env))
              .then(data => results.hunter = data)
          );
        }
      } else if (type === "username") {
        tasks.push(
          fetchAndCache("leakcheck", () => fetchLeakcheck(query, "username", env))
            .then(data => results.leakcheck = data),
          fetchAndCache("osint", () => fetchOSINT(query, "username", env))
            .then(data => results.osint = data)
        );
      } else if (type === "phone") {
        tasks.push(
          fetchAndCache("leakcheck", () => fetchLeakcheck(query, "phone", env))
            .then(data => results.leakcheck = data),
          fetchAndCache("osint", () => fetchOSINT(query, "phone", env))
            .then(data => results.osint = data)
        );
      } else if (type === "hash") {
        tasks.push(
          fetchAndCache("leakcheck", () => fetchLeakcheck(query, "hash", env))
            .then(data => results.leakcheck = data)
        );
      } else if (type === "password") {
        tasks.push(
          fetchAndCache("leakcheck", () => fetchLeakcheck(query, "password", env))
            .then(data => results.leakcheck = data)
        );
      }

      // Execute all tasks concurrently
      await Promise.allSettled(tasks);

      // Cache aggregated result
      await putCache(env, cacheKey, results, "default");

      // Build final response
      const responseBody = {
        success: true,
        query,
        type,
        data: results,
        errors: [],
        recommendations: results.recommendations
      };

      return new Response(JSON.stringify(responseBody, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Unhandled error:", error);
      await updateStats(env, "errors");
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};

// Helper functions in their respective modules are imported below (see index.js imports)
// Example of a helper function implementation is provided in each service module.

// -----------------------------------------
//  (utils/cache.js)
// -----------------------------------------


// -----------------------------------------
//  (utils/safeFetch.js)
// -----------------------------------------


// -----------------------------------------
//  (utils/logger.js)
// -----------------------------------------


// -----------------------------------------
//  (services/whoisxml.js)
// -----------------------------------------


// -----------------------------------------
//  (services/reverseWhois.js)
// -----------------------------------------


// -----------------------------------------
//  (services/shodan.js)
// -----------------------------------------


// -----------------------------------------
//  (services/hunter.js)
// -----------------------------------------


// -----------------------------------------
//  (services/leakcheck.js)
// -----------------------------------------


// -----------------------------------------
//  (services/osintIndustries.js)
// -----------------------------------------
