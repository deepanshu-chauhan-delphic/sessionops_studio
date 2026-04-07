import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("package.json exposes lint, test, and build scripts", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.equal(typeof pkg.scripts.lint, "string");
  assert.equal(typeof pkg.scripts.test, "string");
  assert.equal(typeof pkg.scripts.build, "string");
});

test("prisma schema keeps the required assistant and session statuses", async () => {
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

  assert.match(schema, /enum AssistantStatus[\s\S]*draft[\s\S]*published[\s\S]*archived/);
  assert.match(schema, /enum SessionStatus[\s\S]*active[\s\S]*completed[\s\S]*failed[\s\S]*needs_review/);
});

test(".env.example documents the required runtime variables", async () => {
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

  assert.match(envExample, /^DATABASE_URL=/m);
  assert.match(envExample, /^NEXTAUTH_SECRET=/m);
  assert.match(envExample, /^NEXTAUTH_URL=/m);
});

test("README documents docker, deployment, and AI usage guidance", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.match(readme, /Docker/i);
  assert.match(readme, /Ubuntu VM/i);
  assert.match(readme, /AI Usage Note/i);
});
