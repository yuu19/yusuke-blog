'use client';

import { useEffect, useState } from 'react';

type Session = { authenticated: boolean; subject?: string; browserReceivesOAuthToken?: boolean; tokenType?: string };
type Note = { id: string; title: string; body: string };

export default function Page() {
  const [session, setSession] = useState<Session>({ authenticated: false });
  const [notes, setNotes] = useState<Note[]>([]);

  async function reloadSession() {
    setSession(await fetch('/api/bff/session').then((response) => response.json()));
  }

  useEffect(() => { void reloadSession(); }, []);

  async function loadNotes() {
    const body = await fetch('/api/bff/notes').then((response) => response.json());
    setNotes(body.notes ?? []);
  }

  async function createNote() {
    await fetch('/api/bff/notes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'BFFから作成', body: new Date().toISOString() }),
    });
    await loadNotes();
  }

  async function logout() {
    await fetch('/api/bff/logout', { method: 'POST' });
    setSession({ authenticated: false });
    setNotes([]);
  }

  return (
    <main>
      <p className="eyebrow">Next.js + Hono</p>
      <h1>Cloud Notes BFF</h1>
      <p>ブラウザが持つのはHttpOnlyのランダムなセッションIDだけです。</p>
      {!session.authenticated ? (
        <div className="actions">
          <a className="button" href="/api/bff/login">Bearerでログイン</a>
          <a className="button secondary" href="/api/bff/login?dpop=1">DPoPでログイン</a>
        </div>
      ) : (
        <section>
          <p>subject: <code>{session.subject}</code></p>
          <p>OAuth Tokenがブラウザへ返ったか: <strong>{session.browserReceivesOAuthToken ? 'yes' : 'no'}</strong></p>
          <p>Token type: <strong>{session.tokenType}</strong></p>
          <div className="actions">
            <button onClick={loadNotes}>ノート一覧</button>
            <button onClick={createNote}>ノート作成</button>
            <button className="secondary" onClick={logout}>ローカルログアウト</button>
          </div>
          <ul>{notes.map((note) => <li key={note.id}><strong>{note.title}</strong><p>{note.body}</p></li>)}</ul>
        </section>
      )}
    </main>
  );
}
