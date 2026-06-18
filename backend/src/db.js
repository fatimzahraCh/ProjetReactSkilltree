import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("ATTENTION : DATABASE_URL n'est pas définie dans l'environnement. Le serveur Express peut échouer à se connecter.");
}

const pool = new pg.Pool({
  connectionString: connectionString,
  ssl: connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false
});

// Initialisation des tables au format PostgreSQL
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        email         VARCHAR(255) PRIMARY KEY,
        name          VARCHAR(255) NOT NULL,
        password      VARCHAR(255) NOT NULL,
        dark_mode     INTEGER DEFAULT 0,
        streak_count  INTEGER DEFAULT 0,
        last_active   DATE DEFAULT NULL,
        tutorial_done INTEGER DEFAULT 0,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trees (
        email       VARCHAR(255) PRIMARY KEY,
        xp          INTEGER DEFAULT 0,
        nodes       TEXT DEFAULT '[]',
        edges       TEXT DEFAULT '[]',
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_trees_users FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id      SERIAL PRIMARY KEY,
        email   VARCHAR(255) NOT NULL,
        date    DATE NOT NULL,
        action  VARCHAR(50) NOT NULL DEFAULT 'visit',
        CONSTRAINT fk_activity_log_users FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS certificates (
        id        VARCHAR(255) PRIMARY KEY,
        email     VARCHAR(255) NOT NULL,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_certificates_users FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_activity_email ON activity_log(email);
      CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(date);
    `);
    console.log("Base de données PostgreSQL initialisée avec succès.");
  } catch (err) {
    console.error("Erreur lors de l'initialisation de PostgreSQL:", err);
  }
};

initDb();

export default pool;
