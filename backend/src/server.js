import { createApp } from './app.js';
import { config } from './config/index.js';
import { initDb } from './db/init.js';
import { closePool } from './db/pool.js';

async function main() {
  // รอ MySQL, สร้าง schema, seed ครั้งแรก
  await initDb();

  const app = createApp();
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`✔ Payroll backend พร้อมใช้งานที่ http://localhost:${config.port}`);
    console.log(`  DB: ${config.db.host}:${config.db.port}/${config.db.database} · auth: ${config.auth.mode}`);
  });

  const shutdown = async () => {
    server.close();
    await closePool();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('เริ่มระบบไม่สำเร็จ:', err);
  process.exit(1);
});
