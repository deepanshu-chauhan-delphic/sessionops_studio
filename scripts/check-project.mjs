import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function main() {
  const [pkgRaw, schema, envExample, readme] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);

  const pkg = JSON.parse(pkgRaw);

  assert.equal(typeof pkg.scripts.lint, "string");
  assert.equal(typeof pkg.scripts.test, "string");
  assert.equal(typeof pkg.scripts.build, "string");

  assert.match(schema, /enum AssistantStatus[\s\S]*draft[\s\S]*published[\s\S]*archived/);
  assert.match(schema, /enum SessionStatus[\s\S]*active[\s\S]*completed[\s\S]*failed[\s\S]*needs_review/);

  assert.match(envExample, /^DATABASE_URL=/m);
  assert.match(envExample, /^NEXTAUTH_SECRET=/m);
  assert.match(envExample, /^NEXTAUTH_URL=/m);

  assert.match(readme, /Docker/i);
  assert.match(readme, /Ubuntu VM/i);
  assert.match(readme, /AI Usage Note/i);

  console.log("Project configuration checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
