// ⚠️⚠️⚠️배포환경 관련 설정 주의 필요!!!⚠️⚠️⚠️
module.exports = {
  apps: [
    {
      name: 'codeplanner-backend',
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
      },
    },
  ],
}; 