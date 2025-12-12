import crypto from "crypto"

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

export async function signJwt(payload: Record<string, unknown>) {
  const hasRS256 = !!(process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY)
  const header = { alg: hasRS256 ? "RS256" : "HS256", typ: "JWT" }
  const iat = Math.floor(Date.now() / 1000)
  const expEnv = (process.env.JWT_EXPIRES_IN || "7d").toLowerCase()
  const expSeconds =
    expEnv.endsWith("d")
      ? parseInt(expEnv) * 24 * 60 * 60
      : expEnv.endsWith("h")
      ? parseInt(expEnv) * 60 * 60
      : expEnv.endsWith("m")
      ? parseInt(expEnv) * 60
      : parseInt(expEnv) || 7 * 24 * 60 * 60
  const exp = iat + expSeconds
  const body = { ...payload, iat, exp }
  const encodedHeader = base64url(JSON.stringify(header))
  const encodedBody = base64url(JSON.stringify(body))
  const signingInput = `${encodedHeader}.${encodedBody}`
  let signature: Buffer
  if (hasRS256) {
    const privateKeyPem = (process.env.JWT_PRIVATE_KEY || "").trim()
    const signer = crypto.createSign("RSA-SHA256")
    signer.update(signingInput)
    signer.end()
    signature = signer.sign(privateKeyPem)
  } else {
    const secret = (process.env.JWT_SECRET || "").trim()
    const hmac = crypto.createHmac("sha256", secret)
    hmac.update(signingInput)
    signature = hmac.digest()
  }
  const encodedSignature = base64url(signature)
  return `${signingInput}.${encodedSignature}`
}

export async function verifyJwt(token: string) {
  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("invalid_token")
  const [encodedHeader, encodedBody, encodedSignature] = parts
  const signingInput = `${encodedHeader}.${encodedBody}`
  const signature = Buffer.from(encodedSignature.replace(/-/g, "+").replace(/_/g, "/"), "base64")
  const hasRS256 = !!(process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY)
  let ok: boolean
  if (hasRS256) {
    const publicKeyPem = (process.env.JWT_PUBLIC_KEY || "").trim()
    const verifier = crypto.createVerify("RSA-SHA256")
    verifier.update(signingInput)
    verifier.end()
    ok = verifier.verify(publicKeyPem, signature)
  } else {
    const secret = (process.env.JWT_SECRET || "").trim()
    const hmac = crypto.createHmac("sha256", secret)
    hmac.update(signingInput)
    const expected = hmac.digest()
    ok = crypto.timingSafeEqual(expected, signature)
  }
  if (!ok) throw new Error("invalid_signature")
  const payloadJson = Buffer.from(encodedBody.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
  const payload = JSON.parse(payloadJson)
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && now > payload.exp) throw new Error("token_expired")
  return payload
}
