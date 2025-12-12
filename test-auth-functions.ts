import { hashPassword, verifyPassword } from "./lib/password"
import { signJwt } from "./lib/jwt"

async function testAuthFunctions() {
  console.log("Testing authentication functions...")
  
  // Test password hashing
  const password = "testPassword123"
  const hashed = hashPassword(password)
  console.log("Hashed password:", hashed)
  
  // Test password verification
  const isValid = verifyPassword(password, hashed)
  console.log("Password verification (valid):", isValid)
  
  const isInvalid = verifyPassword("wrongPassword", hashed)
  console.log("Password verification (invalid):", isInvalid)
  
  // Test JWT signing
  const payload = { sub: "test-user-id", name: "Test User" }
  const token = await signJwt(payload)
  console.log("Generated JWT:", token)
  
  console.log("All tests completed!")
}

testAuthFunctions().catch(console.error)