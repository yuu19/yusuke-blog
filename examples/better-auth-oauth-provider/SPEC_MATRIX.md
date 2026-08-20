# Protocol and implementation matrix

The Book keeps four kinds of evidence separate: published standards, the active OAuth 2.1 draft, Better Auth v1.7.1 behavior, and observations from this lab.

| Topic | Normative or primary source | OAuth 2.1 relationship | Lab evidence |
| --- | --- | --- | --- |
| Authorization Code | RFC 6749 sections 4.1 and 4.2; RFC 9700 | OAuth 2.1 keeps the code flow and removes the implicit flow | Browser exchange and code-replay E2E; authorization-code DB inspection checkpoint |
| PKCE | RFC 7636; RFC 9700 | S256 is the baseline for public clients | Wrong verifier and code replay E2E; v1.7.1 consumes the code and returns `401 invalid_request` for a mismatch although RFC 7636 section 4.6 specifies `invalid_grant` |
| Authorization response issuer | RFC 9207 | Included as a mix-up defense | Callback rejects a mismatched `iss` |
| Resource indicators | RFC 8707 | Extension used to bind `aud` | JWT has the Notes API audience |
| Refresh Token | RFC 6749 section 6; RFC 9700 | Rotation or sender constraint is required for public clients | Browser rotation and old-token reuse E2E |
| Introspection | RFC 7662 | Separate extension | Opaque token active/inactive observations |
| Revocation | RFC 7009 | Separate extension | Opaque and JWT behavior compared |
| Device Authorization | RFC 8628 | Separate grant extension | CLI polling implementation and manual approval checkpoint |
| OpenID Connect | OIDC Core 1.0 and Discovery 1.0 | Identity layer above OAuth | ID Token and UserInfo validation |
| PAR | RFC 9126 | Separate extension | Provider resolver boundary only; no custom PAR endpoint |
| DPoP | RFC 9449 | Sender-constrained token mechanism | DPoP-bound BFF login and protected-resource request E2E |

`draft-ietf-oauth-v2-1-15` is informative for the Book's “OAuth 2.1” framing. It is not presented as a published RFC.
