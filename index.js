const express = require('express');
const app = express();
const port = 3000;

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 你的现有路由
app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!',
    version: process.env.APP_VERSION || '1.0.0'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`App running on http://0.0.0.0:${port}`);
});