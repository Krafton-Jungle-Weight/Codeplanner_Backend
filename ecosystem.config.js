// ⚠️⚠️⚠️배포환경 관련 설정 주의 필요!!!⚠️⚠️⚠️
module.exports = {
  apps: [
    {
      name: 'Codeplanner_Backend',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        CORS_ORIGIN: 'https://code-planner.com,https://code-planner.com:3000,https://code-planner.com:5000',
      },
    },
  ],
}; 