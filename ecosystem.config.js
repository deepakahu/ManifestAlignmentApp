module.exports = {
  apps: [
    {
      name: 'manifest-web',
      cwd: './apps/web',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      kill_timeout: 5000,
      listen_timeout: 10000,
      error_file: '~/.pm2/logs/manifest-web-error.log',
      out_file: '~/.pm2/logs/manifest-web-out.log',
      log_file: '~/.pm2/logs/manifest-web-combined.log',
      time: true
    }
  ]
};
