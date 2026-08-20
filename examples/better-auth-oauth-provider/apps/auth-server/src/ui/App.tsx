import { FormEvent, useEffect, useMemo, useState } from 'react';
import { authClient } from './auth-client';

type ScopeDefinition = { label: string; risk: string; optional: boolean };

function requestedScopes(): string[] {
  return (new URLSearchParams(window.location.search).get('scope') ?? '')
    .split(/\s+/u)
    .filter(Boolean);
}

function SignIn() {
  const [email, setEmail] = useState('reader@example.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const result = await authClient.signIn.email({ email, password });
    if (result.error) setError(result.error.message ?? 'Sign-in failed');
  }

  return (
    <main className="card">
      <p className="eyebrow">Authorization Server</p>
      <h1>Cloud Notesへサインイン</h1>
      <p>パスワードは実行時に生成された <code>.local/.env</code> で確認してください。</p>
      <form onSubmit={submit}>
        <label>メールアドレス<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>パスワード<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button type="submit">サインインして認可を続ける</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}

function Consent() {
  const scopes = useMemo(requestedScopes, []);
  const [catalog, setCatalog] = useState<Record<string, ScopeDefinition>>({});
  const [accepted, setAccepted] = useState(() => new Set(scopes));
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/lab/scope-catalog').then((response) => response.json()).then(setCatalog).catch(() => setCatalog({}));
  }, []);

  function toggle(scope: string, checked: boolean) {
    const next = new Set(accepted);
    if (checked) next.add(scope);
    else next.delete(scope);
    setAccepted(next);
  }

  async function decide(accept: boolean) {
    setError('');
    const result = await authClient.oauth2.consent({
      accept,
      scope: [...accepted].join(' '),
    });
    if (result.error) setError(result.error.message ?? 'Consent failed');
  }

  return (
    <main className="card">
      <p className="eyebrow">Progressive consent</p>
      <h1>Cloud Notesへのアクセス</h1>
      <p>説明文はClientではなくAuthorization Serverのscope catalogから取得しています。</p>
      <ul className="scope-list">
        {scopes.map((scope) => {
          const definition = catalog[scope];
          const optional = definition?.optional ?? false;
          return (
            <li key={scope}>
              <label>
                <input
                  type="checkbox"
                  checked={accepted.has(scope)}
                  disabled={!optional}
                  onChange={(event) => toggle(scope, event.target.checked)}
                />
                <span><strong>{definition?.label ?? scope}</strong><small>{scope} · risk: {definition?.risk ?? 'unknown'}</small></span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="actions">
        <button type="button" onClick={() => decide(true)}>選択した権限を許可</button>
        <button type="button" className="secondary" onClick={() => decide(false)}>拒否</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}

function Device() {
  const [userCode, setUserCode] = useState(() => new URLSearchParams(window.location.search).get('user_code') ?? '');
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('');

  async function inspect(event: FormEvent) {
    event.preventDefault();
    const formatted = userCode.trim().replaceAll('-', '').toUpperCase();
    const result = await authClient.device({ query: { user_code: formatted } });
    if (result.error) setMessage(result.error.error_description ?? 'Code is invalid');
    else setRequest(result.data as Record<string, unknown>);
  }

  async function decide(approve: boolean) {
    const formatted = userCode.trim().replaceAll('-', '').toUpperCase();
    const result = approve
      ? await authClient.device.approve({ userCode: formatted })
      : await authClient.device.deny({ userCode: formatted });
    setMessage(result.error ? result.error.error_description ?? 'Request failed' : approve ? 'CLIを許可しました。' : 'CLIを拒否しました。');
  }

  return (
    <main className="card">
      <p className="eyebrow">Device Authorization</p>
      <h1>CLIに表示されたコードを確認</h1>
      <form onSubmit={inspect}>
        <label>ユーザーコード<input value={userCode} onChange={(event) => setUserCode(event.target.value)} /></label>
        <button type="submit">要求を確認</button>
      </form>
      {request && <pre>{JSON.stringify(request, null, 2)}</pre>}
      {request && <div className="actions"><button onClick={() => decide(true)}>許可</button><button className="secondary" onClick={() => decide(false)}>拒否</button></div>}
      {message && <p role="status">{message}</p>}
    </main>
  );
}

export function App() {
  if (window.location.pathname === '/consent') return <Consent />;
  if (window.location.pathname.startsWith('/device')) return <Device />;
  return <SignIn />;
}
