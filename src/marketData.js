const axios = require('axios');

function normalizeSymbol(raw) {
  const clean = String(raw).trim().toUpperCase().replace(/\s+/g, '');
  if (clean.includes('/')) return clean;
  if (clean.length === 6) return `${clean.slice(0, 3)}/${clean.slice(3)}`;
  return clean;
}

// Returns closing prices, oldest first.
async function getCloses(symbol, interval) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) throw new Error('TWELVEDATA_API_KEY is not set');

  const { data } = await axios.get('https://api.twelvedata.com/time_series', {
    params: { symbol: normalizeSymbol(symbol), interval, outputsize: 120, apikey: apiKey },
    timeout: 10000,
  });

  if (data.status === 'error' || !data.values) {
    throw new Error(data.message || 'No data returned');
  }
  return data.values.map((v) => parseFloat(v.close)).reverse();
}

module.exports = { getCloses };
