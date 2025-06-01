module.exports = jest.fn().mockImplementation(() => ({
  artifacts: {},
  lhr: {
    audits: {
      'first-contentful-paint': { numericValue: 1500 },
      'largest-contentful-paint': { numericValue: 2500 },
      'cumulative-layout-shift': { numericValue: 0.1 },
      'total-blocking-time': { numericValue: 300 },
      'first-input-delay': { numericValue: 100 }
    },
    categories: {
      performance: { score: 0.85 },
      accessibility: { score: 0.90 },
      'best-practices': { score: 0.95 },
      seo: { score: 0.88 }
    }
  }
}));