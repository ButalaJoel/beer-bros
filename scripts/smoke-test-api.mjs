import assert from 'node:assert/strict'

const api = process.env.API_URL ?? 'http://127.0.0.1:3001/api'
const origin = process.env.WEB_ORIGIN ?? 'http://localhost:5173'

const health = await fetch(`${api}/health`)
assert.equal(health.status, 200, 'health endpoint should be public')
assert.deepEqual(await health.json(), { status: 'ok', service: 'beer-bros-api' })

const anonymousStories = await fetch(`${api}/stories`)
assert.equal(anonymousStories.status, 401, 'story feed should require an account session')

const underageRegistration = await fetch(`${api}/auth/register`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin },
  body: JSON.stringify({
    email: 'minor@example.test',
    password: 'test-password-long-enough',
    handle: 'testminor',
    displayName: 'Test Minor',
    dateOfBirth: '2010-01-01',
    acceptedResponsibleUse: true,
  }),
})
assert.equal(underageRegistration.status, 403, 'registration must reject under-18 users')

const blockedOrigin = await fetch(`${api}/auth/logout`, { method: 'POST', headers: { origin: 'https://not-beer-bros.example' } })
assert.equal(blockedOrigin.status, 403, 'write requests must reject unapproved origins')

console.log('API smoke checks passed: health, auth required, 18+ gate, and origin check.')
