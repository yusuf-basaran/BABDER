module.exports = {
  ci: {
    collect: {
      startServerCommand: "node scripts/serve.mjs",
      startServerReadyPattern: "BABDER preview",
      url: ["http://127.0.0.1:4173/", "http://127.0.0.1:4173/sayfalar/hakkimizda.html", "http://127.0.0.1:4173/sayfalar/haberler.html"],
      numberOfRuns: 1,
      settings: { chromeFlags: "--no-sandbox --disable-dev-shm-usage" }
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }]
      }
    }
  }
};
