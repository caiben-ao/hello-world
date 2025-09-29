const express = require('express');
const app = express();
const port = 3000;

console.log('✅ 1. 应用开始启动...');
console.log('✅ 2. Express模块加载成功');

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库配置和连接
const { Client } = require('pg');

// 从环境变量读取数据库配置
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: true,  // RDS通常需要SSL
  ssl: { rejectUnauthorized: false }
};

console.log('✅ 数据库配置加载:', { 
  host: dbConfig.host, 
  database: dbConfig.database,
  user: dbConfig.user,
  port: dbConfig.port 
});

// 数据库连接测试函数
async function testDatabaseConnection() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 测试查询
    const result = await client.query('SELECT version() as version, NOW() as current_time');
    console.log('✅ 数据库版本:', result.rows[0].version);
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 健康检查端点
app.get('/health', async (req, res) => {
  console.log('✅ 健康检查被调用:', new Date().toISOString());
  
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'pending'
    }
  };

  try {
    // 测试数据库连接
    const dbHealthy = await testDatabaseConnection();
    healthCheck.checks.database = dbHealthy ? 'healthy' : 'unhealthy';
    
    if (!dbHealthy) {
      healthCheck.status = 'unhealthy';
      return res.status(503).json(healthCheck);
    }
    
    console.log('✅ 健康检查完成 - 所有服务正常');
    res.status(200).json(healthCheck);
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
    healthCheck.checks.database = 'error';
    healthCheck.status = 'unhealthy';
    healthCheck.error = error.message;
    res.status(503).json(healthCheck);
  }
});

// 新增：查询resource_info表数据端点
app.get('/resource-info', async (req, res) => {
  console.log('✅ 查询resource_info表被调用:', new Date().toISOString());
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // 查询hostinfo数据库的resource_info表所有数据
    const result = await client.query('SELECT * FROM resource_info');
    
    await client.end();
    
    console.log(`✅ 查询成功，返回 ${result.rows.length} 条记录`);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
    
  } catch (error) {
    console.error('❌ 查询resource_info表失败:', error.message);
    
    // 安全地关闭连接
    try {
      await client.end();
    } catch (e) {
      // 忽略关闭错误
    }
    
    res.status(500).json({
      success: false,
      error: '查询数据库失败',
      message: error.message
    });
  }
});

// 你的现有路由
app.get('/', (req, res) => {
  console.log('✅ 根路径被访问:', new Date().toISOString());
  res.json({
    message: 'Hello World!',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 添加错误处理
app.use((err, req, res, next) => {
  console.error('❌ 应用错误:', err);
  res.status(500).json({ error: '内部服务器错误' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: '端点不存在',
    path: req.originalUrl,
    availableEndpoints: ['/', '/health', '/resource-info']
  });
});

// 应用启动
app.listen(port, '0.0.0.0', () => {
  console.log('✅ 3. Express服务器启动成功');
  console.log(`✅ 4. 应用运行在 http://0.0.0.0:${port}`);
  console.log(`✅ 5. 健康检查端点: http://0.0.0.0:${port}/health`);
  console.log(`✅ 6. 资源信息端点: http://0.0.0.0:${port}/resource-info`);
  
  // 启动时测试数据库连接
  testDatabaseConnection().then(success => {
    if (success) {
      console.log('✅ 7. 应用启动完成 - 所有系统正常');
    } else {
      console.log('⚠️ 应用启动完成 - 但数据库连接失败');
    }
  });
});

// 添加进程错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
});