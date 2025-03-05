async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      const res = await fetch(url, options);
      if (res.status !== 429) return res;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
    throw new Error('Exceeded retries due to rate limiting');
  }
  
  export { fetchWithRetry };