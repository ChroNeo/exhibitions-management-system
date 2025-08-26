import Fastify from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })

// DB connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

app.get('/health', async () => ({ ok: true }))

app.get('/db/ping', async () => {
  const [rows] = await pool.query('SELECT 1 AS ping')
  return { db: 'ok', result: rows[0] }
})

const port = Number(process.env.PORT || 3001)
app.listen({ port }).then(() => {
  console.log(`API running on http://localhost:${port}`)
})
