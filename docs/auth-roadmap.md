# Auth Roadmap

EventCapture currently uses signed access tokens with JWT `jti` values and durable logout revocation stored in the database.

## Current state

- Access tokens are signed with a unique `jti`
- Logout writes the token `jti` to `revoked_access_tokens`
- Revocation survives backend restarts and shared-database multi-instance deployments
- Expired revoked tokens are cleaned up during startup and revocation checks

## Why this is acceptable for now

- It avoids in-memory-only logout behavior
- It works correctly across multiple app instances
- It keeps the current mobile auth flow stable

## Why this is not the final auth model

- Access tokens are still bearer tokens with relatively long lifetime compared to modern SaaS standards
- There is no refresh-token rotation yet
- There is no device/session inventory for the user
- Forced logout on all devices is not implemented

## Recommended next step

Migrate to:

1. Short-lived access tokens
2. Refresh tokens stored in a durable session table
3. Refresh-token rotation on every refresh
4. Reuse detection and replay protection
5. User-visible session management
6. Admin session invalidation tooling

## Suggested target design

- `access_token`: 10 to 15 minutes
- `refresh_token`: long-lived opaque token or signed token with durable server-side session record
- Session table fields:
  - `id`
  - `user_id`
  - `token_hash`
  - `created_at`
  - `expires_at`
  - `revoked_at`
  - `last_seen_at`
  - `device_label`
  - `ip_address`
  - `user_agent`

## Migration approach

1. Add refresh-token/session table without removing current login flow
2. Issue refresh token alongside access token
3. Add refresh endpoint
4. Update mobile app to refresh silently
5. Reduce access-token lifetime
6. Add session revocation UI/API
7. Decommission reliance on durable revoked access-token lookup for normal logout

