import dotenv from 'dotenv';
dotenv.config();

const { default: app } = await import('./app.js');
const { connectDB } = await import('./db.js');

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error('Database connection failed. Server not started.', error);
  process.exit(1);
}
