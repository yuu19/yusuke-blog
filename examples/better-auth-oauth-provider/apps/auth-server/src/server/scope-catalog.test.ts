import { describe, expect, it } from 'vitest';
import { SCOPES } from '@oauth-lab/protocol';
import { NOTES_RESOURCE_ALLOWED_SCOPES, SUPPORTED_SCOPES } from './scope-catalog';

describe('authorization server scope policy', () => {
  it('keeps OIDC and resource scopes in a combined resource grant', () => {
    expect(NOTES_RESOURCE_ALLOWED_SCOPES).toEqual(expect.arrayContaining([
      SCOPES.openid,
      SCOPES.notesRead,
      SCOPES.notesWrite,
    ]));
  });

  it('does not allow a resource scope the provider does not support', () => {
    expect(NOTES_RESOURCE_ALLOWED_SCOPES.every((scope) => SUPPORTED_SCOPES.includes(scope))).toBe(true);
  });
});
