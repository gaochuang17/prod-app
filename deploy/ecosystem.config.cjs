module.exports = {
  apps: [
    {
      name: "prod-api",
      script: "dist/index.js",
      cwd: "/opt/prod-app/server",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOST: "127.0.0.1",
      },
    },
  ],
};
