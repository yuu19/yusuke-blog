import { useEffect, useMemo, useState } from 'react';
import {
  assertIssuer,
  AUTH_ISSUER,
  consumeTransaction,
  createPkce,
  createTraceId,
  createTransaction,
  LAB_ORIGINS,
  NOTES_RESOURCE,
  readOAuthResponse,
  SCOPES,
  storeTransaction,
  summarizeSecret,
  summarizeUnverifiedJwt,
  summarizeVerifiedJwt,
  type OAuthTokenResponse,
  validateIdToken,
} from '@oauth-lab/protocol';

type InspectorState = Record<string, unknown>;
type Note = { id: string; title: string; body: string; ownerSubject: string };

const redirectUri = `${LAB_ORIGINS.publicClient}/callback`;

export function App() {
  const [tokens, setTokens] = useState<OAuthTokenResponse | null>(null);
  const [inspector, setInspector] = useState<InspectorState>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [message, setMessage] = useState('');
  const [requestOfflineAccess, setRequestOfflineAccess] = useState(false);
  const [requestOidc, setRequestOidc] = useState(false);
  const [requestJwt, setRequestJwt] = useState(false);

  const grantedScopes = useMemo(
    () => new Set((tokens?.scope ?? '').split(/\s+/u).filter(Boolean)),
    [tokens],
  );

  useEffect(() => {
    if (window.location.pathname !== '/callback') return;
    const query = new URLSearchParams(window.location.search);
    const error = query.get('error');
    if (error) {
      setMessage(`${error}: ${query.get('error_description') ?? 'authorization failed'}`);
      return;
    }

    const state = query.get('state');
    const code = query.get('code');
    if (!state || !code) {
      setMessage('Callback is missing code or state.');
      return;
    }

    void (async () => {
      try {
        const transaction = consumeTransaction(sessionStorage, state);
        assertIssuer(query.get('iss'), transaction.issuer);
        const response = await fetch(`${AUTH_ISSUER}/oauth2/token`, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-trace-id': createTraceId(),
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: __PUBLIC_CLIENT_ID__,
            redirect_uri: transaction.redirectUri,
            code_verifier: transaction.codeVerifier,
          }),
        });
        const tokenResponse = await readOAuthResponse(response);
        setTokens(tokenResponse);
        const idTokenClaims = tokenResponse.id_token
          ? await validateIdToken({
              idToken: tokenResponse.id_token,
              accessToken: tokenResponse.access_token,
              issuer: transaction.issuer,
              clientId: __PUBLIC_CLIENT_ID__,
              nonce: transaction.nonce,
            })
          : undefined;
        setInspector({
          accessToken: tokenResponse.access_token.includes('.')
            ? await summarizeUnverifiedJwt(tokenResponse.access_token)
            : await summarizeSecret('opaque-access-token', tokenResponse.access_token),
          refreshToken: tokenResponse.refresh_token
            ? await summarizeSecret('refresh-token', tokenResponse.refresh_token)
            : undefined,
          idToken: tokenResponse.id_token && idTokenClaims
            ? await summarizeVerifiedJwt(tokenResponse.id_token, idTokenClaims)
            : undefined,
        });
        history.replaceState(null, '', '/');
        setMessage('CodeをTokenへ交換しました。Tokenの生値は画面にもログにも出していません。');
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : 'Callback validation failed');
      }
    })();
  }, []);

  async function authorize(mode: 'read' | 'write') {
    const pkce = await createPkce();
    const scope = new Set<string>([SCOPES.notesRead]);
    if (mode === 'write') scope.add(SCOPES.notesWrite);
    if (requestOfflineAccess) scope.add(SCOPES.offlineAccess);
    if (requestOidc) {
      scope.add(SCOPES.openid);
      scope.add(SCOPES.profile);
      scope.add(SCOPES.email);
    }

    const transaction = createTransaction({
      codeVerifier: pkce.verifier,
      nonce: requestOidc ? crypto.randomUUID() : undefined,
      issuer: AUTH_ISSUER,
      redirectUri,
    });
    storeTransaction(sessionStorage, transaction);

    const authorizationUrl = new URL(`${AUTH_ISSUER}/oauth2/authorize`);
    authorizationUrl.search = new URLSearchParams({
      response_type: 'code',
      client_id: __PUBLIC_CLIENT_ID__,
      redirect_uri: redirectUri,
      scope: [...scope].join(' '),
      state: transaction.state,
      code_challenge: pkce.challenge,
      code_challenge_method: 'S256',
      ...(transaction.nonce ? { nonce: transaction.nonce } : {}),
    }).toString();
    if (requestJwt) authorizationUrl.searchParams.set('resource', NOTES_RESOURCE);
    window.location.assign(authorizationUrl);
  }

  async function callNotes(method: 'GET' | 'POST') {
    if (!tokens) return;
    const response = await fetch(`${NOTES_RESOURCE}/notes`, {
      method,
      headers: {
        authorization: `Bearer ${tokens.access_token}`,
        'content-type': 'application/json',
        'x-trace-id': createTraceId(),
      },
      body: method === 'POST'
        ? JSON.stringify({ title: 'OAuthで作成したノート', body: new Date().toISOString() })
        : undefined,
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage(JSON.stringify(body));
      return;
    }
    setNotes(method === 'GET' ? body.notes : [...notes, body.note]);
  }

  async function refresh() {
    if (!tokens?.refresh_token) return;
    const response = await fetch(`${AUTH_ISSUER}/oauth2/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-trace-id': createTraceId() },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: __PUBLIC_CLIENT_ID__,
      }),
    });
    const nextTokens = await readOAuthResponse(response);
    setTokens(nextTokens);
    setInspector({
      accessToken: nextTokens.access_token.includes('.')
        ? await summarizeUnverifiedJwt(nextTokens.access_token)
        : await summarizeSecret('opaque-access-token', nextTokens.access_token),
      refreshToken: nextTokens.refresh_token
        ? await summarizeSecret('rotated-refresh-token', nextTokens.refresh_token)
        : undefined,
    });
    setMessage('Refresh Tokenをローテーションしました。古いTokenの再利用は失敗します。');
  }

  function clearTokens() {
    setTokens(null);
    setInspector({});
    setNotes([]);
    setMessage('メモリ上のTokenを破棄しました。');
  }

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Public OAuth Client</p>
        <h1>Cloud Notes</h1>
        <p>このReactアプリはClient Secretを持たず、Tokenをメモリだけに保持します。</p>
      </header>

      <section className="panel">
        <h2>1. 要求する性質</h2>
        <label><input type="checkbox" checked={requestOfflineAccess} onChange={(event) => setRequestOfflineAccess(event.target.checked)} /> 継続アクセス（offline_access）</label>
        <label><input type="checkbox" checked={requestOidc} onChange={(event) => setRequestOidc(event.target.checked)} /> OIDC identity scopes</label>
        <label><input type="checkbox" checked={requestJwt} onChange={(event) => setRequestJwt(event.target.checked)} /> Notes APIをresourceに指定してJWT Access Tokenを要求</label>
        <div className="actions">
          <button onClick={() => authorize('read')}>閲覧権限で認可</button>
          <button onClick={() => authorize('write')}>編集権限へstep-up</button>
        </div>
      </section>

      <section className="panel">
        <h2>2. Tokenを使う</h2>
        <p>Granted scopes: {[...grantedScopes].join(', ') || 'none'}</p>
        <div className="actions">
          <button disabled={!tokens} onClick={() => callNotes('GET')}>ノート一覧</button>
          <button disabled={!tokens || !grantedScopes.has(SCOPES.notesWrite)} onClick={() => callNotes('POST')}>ノート作成</button>
          <button disabled={!tokens?.refresh_token} onClick={refresh}>Refresh</button>
          <button className="secondary" disabled={!tokens} onClick={clearTokens}>Token破棄</button>
        </div>
        {notes.length > 0 && <ul>{notes.map((note) => <li key={note.id}><strong>{note.title}</strong><p>{note.body}</p></li>)}</ul>}
      </section>

      <section className="panel">
        <h2>3. Redacted Inspector</h2>
        <pre>{JSON.stringify(inspector, null, 2)}</pre>
      </section>

      {message && <p className="message" role="status">{message}</p>}
    </main>
  );
}
