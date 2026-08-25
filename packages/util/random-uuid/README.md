# dsh-random-uuid

English | [中文](README.zh.md)

`randomUuid()` is a zero-dependency RFC 4122 UUID v4 generator for shared browser and Node code. It uses `crypto.getRandomValues()`, which remains available on ordinary HTTP origins where the secure-context-only `crypto.randomUUID()` convenience method is absent.

The package owns only identifier generation. Consumers retain ownership of identifier brands, persistence, uniqueness scope, and wire semantics. Browser bundles inline it because it has no singleton state or runtime identity to share.

## Model Experience

None. Consumers use generated identifiers for model-hidden correlation and browser-local state.

## Known Limitations and Deferred Work

- The runtime must provide Web Crypto `getRandomValues()`; unsupported legacy environments fail at the call site instead of falling back to weaker entropy.
