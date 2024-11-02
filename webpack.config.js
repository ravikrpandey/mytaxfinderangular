module.exports = {
    // your existing config
    resolve: {
      fallback: {
        "url": require.resolve("url/"),
        "path": require.resolve("path-browserify")
      }
    }
  };
  