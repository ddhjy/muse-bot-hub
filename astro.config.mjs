import { defineConfig } from "astro/config";

function redirectSlashlessBase() {
  const rewrite = (req, res, next) => {
    const raw = req.url ?? "";
    const pathOnly = raw.split("?")[0];
    if (pathOnly === "/muse-bot-hub") {
      const query = raw.slice(pathOnly.length);
      res.statusCode = 308;
      res.setHeader("Location", `/muse-bot-hub/${query}`);
      res.end();
      return;
    }
    next();
  };
  return {
    name: "redirect-slashless-base",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  site: "https://ddhjy.github.io",
  base: "/muse-bot-hub",
  output: "static",
  trailingSlash: "ignore",
  vite: {
    plugins: [redirectSlashlessBase()],
  },
});
