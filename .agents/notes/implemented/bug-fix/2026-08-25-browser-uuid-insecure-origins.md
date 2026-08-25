# Agent Note: Generate browser UUIDs on insecure origins

Status: implemented

English | [中文](2026-08-25-browser-uuid-insecure-origins.zh.md)

## Problem

The Web profile supports LAN access over ordinary HTTP. Web Crypto exposes `getRandomValues()` on these origins, but browsers reserve `crypto.randomUUID()` for secure contexts. A browser client that calls the convenience method can load the application and open its event sockets, then fail before sending a unary RPC or creating a draft image identifier. Connection bootstrap compounds the failure by aborting both established event sockets when `host.describe` cannot mint its request id.

UUID generation spans the API carrier, generic connection RPC, fixture data, and conversation drafts. Keeping independent implementations in those packages risks inconsistent version or variant bits and violates client-bundle duplication checks.

## Decision

`@deepseek-ai/dsh-random-uuid` owns one zero-dependency `randomUuid()` function. It fills 16 bytes through `globalThis.crypto.getRandomValues()`, stamps RFC 4122 version 4 and variant bits, and returns the lowercase hyphenated representation. It deliberately does not fall back to non-cryptographic entropy.

The package has no singleton state or runtime identity. The client-bundle purity rule classifies it as inline-safe, so browser bundles embed the function while published Node modules retain an ordinary workspace dependency. Browser code uses this function wherever identifier creation must work on supported HTTP origins; host-only code may continue using `node:crypto`.

## Alternatives considered

**Keep the helper inside `dsh-client-connection`.** Rejected because `host-apiproxy` and `ui-conversation` would need a client-plugin value import, which either duplicates plugin runtime code or violates bundle purity.

**Copy the algorithm into each browser package.** Rejected because the copies have no distinct business semantics and the duplication check correctly treats them as one shared primitive.

**Use counters or `Math.random()` outside secure contexts.** Rejected because correlation and draft identifiers require unpredictable collision-resistant values, and `getRandomValues()` already supplies cryptographic entropy on the supported HTTP origins.

**Require HTTPS for LAN access.** Rejected because the Web profile explicitly supports trusted LAN authorities over HTTP; UUID creation must honor that deployment contract.

## Verification

Utility tests pin deterministic bytes, lowercase formatting, version bits, variant bits, and operation without `crypto.randomUUID`. Fetch-carrier coverage calls `host.describe` with only `getRandomValues()` available. Conversation coverage creates a draft image under the same constraint. Client-bundle purity coverage admits the shared package, and the real Web composition remains the browser-level owner of connection bootstrap behavior.

## Consequences

Unary API bootstrap and draft image creation work on trusted HTTP LAN origins as well as secure origins. Browser bundles gain a small inlined helper with no shared state. Environments without Web Crypto fail at identifier creation instead of silently weakening entropy; those legacy environments remain unsupported.
