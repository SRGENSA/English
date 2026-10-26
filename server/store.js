import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export function createStore(
  filename = process.env.TALAQA_DB_PATH || resolve("data/talaqa.sqlite"),
) {
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  db.exec(
    `CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,created INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS progress(user_id TEXT PRIMARY KEY REFERENCES users(id),data TEXT NOT NULL);`,
  );
  const digest = (token) => createHash("sha256").update(token).digest("hex");
  return {
    async register(email, name, password) {
      const salt = randomBytes(16).toString("hex"),
        hash = Buffer.from(await scrypt(password, salt, 64)).toString("hex");
      const id = randomBytes(16).toString("hex");
      try {
        db.prepare("INSERT INTO users VALUES(?,?,?,?,?)").run(
          id,
          email,
          name,
          salt + ":" + hash,
          Date.now(),
        );
      } catch (e) {
        if (
          e.code === "ERR_SQLITE_ERROR" &&
          String(e.message).includes("UNIQUE")
        )
          return null;
        throw e;
      }
      return { id, email, name };
    },
    async authenticate(email, password) {
      const row = db.prepare("SELECT * FROM users WHERE email=?").get(email);
      const salt = row?.password.split(":")[0] || "dummy-salt-for-timing";
      const derived = Buffer.from(await scrypt(password, salt, 64));
      if (
        !row ||
        !timingSafeEqual(
          derived,
          Buffer.from(row.password.split(":")[1], "hex"),
        )
      )
        return null;
      return { id: row.id, email: row.email, name: row.name };
    },
    session(userId) {
      const token = randomBytes(32).toString("hex");
      db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
      db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
        digest(token),
        userId,
        Date.now() + 30 * 86400000,
      );
      return token;
    },
    user(token) {
      if (!token || token.length !== 64) return null;
      const row = db
        .prepare(
          "SELECT u.id,u.email,u.name FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
        )
        .get(digest(token), Date.now());
      return row || null;
    },
    logout(token) {
      if (token)
        db.prepare("DELETE FROM sessions WHERE token=?").run(digest(token));
    },
    getProgress(id) {
      const row = db
        .prepare("SELECT data FROM progress WHERE user_id=?")
        .get(id);
      return row ? JSON.parse(row.data) : null;
    },
    saveProgress(id, data) {
      db.prepare(
        "INSERT INTO progress VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data",
      ).run(id, JSON.stringify(data));
      db.prepare("UPDATE users SET name=? WHERE id=?").run(data.name, id);
    },
    close() {
      db.close();
    },
  };
}
export function validProgress(p) {
  return (
    p &&
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    p.name.length <= 30 &&
    Number.isInteger(p.goal) &&
    p.goal >= 1 &&
    p.goal <= 100 &&
    Array.isArray(p.known) &&
    p.known.length <= 1000 &&
    p.known.every((k) => typeof k === "string" && k.length <= 100) &&
    Array.isArray(p.days) &&
    p.days.length <= 10000 &&
    p.days.every((d) => typeof d === "string" && d.length <= 20) &&
    Array.isArray(p.results) &&
    p.results.length <= 1000 &&
    p.results.every(
      (r) =>
        r &&
        Number.isInteger(r.score) &&
        Number.isInteger(r.total) &&
        r.total > 0 &&
        r.score >= 0 &&
        r.score <= r.total &&
        typeof r.label === "string" &&
        r.label.length < 100 &&
        typeof r.date === "string" &&
        Number.isFinite(Date.parse(r.date)),
    )
  );
}
