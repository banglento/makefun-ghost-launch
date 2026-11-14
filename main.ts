// MakeFun Ghost — entrypoint for make.fun bounty makefun-coin-launch-01 (Node 22, standard library only).
//
// The coin itself was launched on pump.fun by the agent; this program is the part the
// grader runs. It reads LAUNCH.json from the repository root, checks that the file is a
// JSON object whose mint and create_signature fields are well-formed base58 strings, and
// copies the file byte for byte into the output directory, where the gate reads it.
//
// The program is deterministic: no network, no clock, no randomness, and nothing is
// printed on success, so two runs always leave the same bytes behind.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand in for
// /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const LAUNCH_FILE = 'LAUNCH.json';

function fail(reason: string): never {
  console.error(`main.ts: ${reason}`);
  process.exit(1);
}

// The gate's shape rules for a hand-in file: the mint is a base58 Solana address of
// 32 to 44 characters and the create signature is base58 of 64 to 88 characters.
// Length alone is not enough: every character must come from the base58 alphabet
// (no 0, O, I or l), so a mistyped or padded value is refused here instead of
// being handed to the gate.
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_CHARS = new Set(BASE58_ALPHABET);

function hasShape(value: unknown, min: number, max: number): boolean {
  if (typeof value !== 'string' || value.length < min || value.length > max) {
    return false;
  }
  for (const ch of value) {
    if (!BASE58_CHARS.has(ch)) {
      return false;
    }
  }
  return true;
}

const sourcePath = join(BOT_DIR, LAUNCH_FILE);
let raw: string;
try {
  raw = readFileSync(sourcePath, 'utf8');
} catch {
  fail(`cannot read ${LAUNCH_FILE} in ${BOT_DIR}`);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch {
  fail(`${LAUNCH_FILE} is not valid JSON`);
}

if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
  fail(`${LAUNCH_FILE} must hold one JSON object`);
}
const launch = parsed as Record<string, unknown>;
if (!hasShape(launch.mint, 32, 44)) {
  fail('mint must be a base58 string of 32 to 44 characters');
}
if (!hasShape(launch.create_signature, 64, 88)) {
  fail('create_signature must be a base58 string of 64 to 88 characters');
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(sourcePath, join(OUTPUT_DIR, LAUNCH_FILE));
} catch (err) {
  fail(`cannot write ${LAUNCH_FILE} to ${OUTPUT_DIR}: ${(err as Error).message}`);
}
