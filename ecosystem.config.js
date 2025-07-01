// ⚠️⚠️⚠️배포환경 관련 설정 주의 필요!!!⚠️⚠️⚠️
module.exports = {
  apps: [
    {
      name: 'Codeplanner-Backend',
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
        CORS_ORIGIN: 'http://3.38.25.129,http://3.38.25.129:3000,http://3.38.25.129:5000',
        BASE_URL: 'http://3.38.25.129:5000'
      },
    },
  ],
}; 