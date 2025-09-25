const express = require('express');
const app = express();
const port = 3000;

console.log('✅ 1. 应用开始启动...');
console.log('✅ 2. Express模块加载成功');

// 健康检查端点
app.get('/health', (req, res) => {
  console.log('✅ 健康检查被调用:', new Date().toISOString());
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 你的现有路由
app.get('/', (req, res) => {
  console.log('✅ 根路径被访问:', new Date().toISOString());
  res.json({
    message: 'Hello World!',
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// 添加错误处理
app.use((err, req, res, next) => {
  console.error('❌ 应用错误:', err);
  res.status(500).json({ error: '内部服务器错误' });
});

app.listen(port, '0.0.0.0', () => {
  console.log('✅ 3. Express服务器启动成功');
  console.log(`✅ 4. 应用运行在 http://0.0.0.0:${port}`);
  console.log(`✅ 5. 健康检查端点: http://0.0.0.0:${port}/health`);
});

// 添加进程错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
});