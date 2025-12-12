import crypto from "crypto"

const SALT_LEN = 16
const ITERATIONS = 120000
const KEY_LEN = 32
const DIGEST = "sha256"

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(SALT_LEN)
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST)
  return `pbkdf2:${ITERATIONS}:${DIGEST}:${salt.toString("hex")}:${derived.toString("hex")}`
}

export function verifyPassword(password: string, stored: string) {
  const parts = stored.split(":")
  if (parts.length !== 5 || parts[0] !== "pbkdf2") return false
  const iterations = parseInt(parts[1], 10)
  const digest = parts[2]
  const salt = Buffer.from(parts[3], "hex")
  const expected = Buffer.from(parts[4], "hex")
  const derived = crypto.pbkdf2Sync(password, salt, iterations, expected.length, digest)
  return crypto.timingSafeEqual(derived, expected)
}
