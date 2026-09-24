/**
 * JH-52 — Data API lock migration is a privilege/RLS file only.
 * Static contract so CI (no Postgres) still gates the SQL shape.
 */
import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  path.resolve(__dirname, "../../../../db/migrations/004_lock_data_api.sql"),
  "utf8",
);

describe("004_lock_data_api.sql", () => {
  it("enables RLS on public tables without FORCE or policies", () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).not.toMatch(/FORCE ROW LEVEL SECURITY/);
    expect(sql).not.toMatch(/CREATE POLICY/);
    expect(sql).not.toMatch(/DISABLE ROW LEVEL SECURITY/);
  });

  it("revokes anon/authenticated on tables and sequences when those roles exist", () => {
    expect(sql).toMatch(/REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon/);
    expect(sql).toMatch(
      /REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated/,
    );
    expect(sql).toMatch(/pg_roles/);
    expect(sql).toMatch(/rolname = 'anon'/);
    expect(sql).toMatch(/rolname = 'authenticated'/);
  });

  it("revokes default privileges so future public tables are not auto-granted", () => {
    expect(sql).toMatch(
      /ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon/,
    );
    expect(sql).toMatch(
      /ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon/,
    );
    expect(sql).toMatch(
      /ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated/,
    );
    expect(sql).toMatch(
      /ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated/,
    );
  });

  it("does not change schema shape (no CREATE/DROP/ALTER COLUMN)", () => {
    const uncommented = sql
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    expect(uncommented).not.toMatch(/CREATE TABLE/);
    expect(uncommented).not.toMatch(/DROP TABLE/);
    expect(uncommented).not.toMatch(/ALTER TABLE\b[^;]*\bADD\b/);
    expect(uncommented).not.toMatch(/ALTER TABLE\b[^;]*\bDROP\b/);
    expect(uncommented).not.toMatch(/ALTER COLUMN/);
  });

  it("names the catalog tables this lock is for", () => {
    for (const name of [
      "vehicles",
      "documents",
      "chunks",
      "index_state",
      "chunk_image_embeddings",
      "ask_rate_buckets",
    ]) {
      expect(sql).toContain(name);
    }
  });
});
