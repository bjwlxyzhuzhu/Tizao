import { useState } from 'react';
import { useSessionStore } from '../stores/session';

export function Login() {
  const login = useSessionStore((state) => state.login);
  const loading = useSessionStore((state) => state.loading);
  const error = useSessionStore((state) => state.error);

  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('student123');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void login(username, password);
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>钛境智造</h1>
        <p>钛合金构件智能制造与人机协同虚拟仿真实验</p>

        <div className="field">
          <label htmlFor="username">用户名</label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button className="primary" type="submit" disabled={loading}>
          {loading ? '登录中…' : '进入实验'}
        </button>

        {error ? <div className="error">{error}</div> : null}

        <div className="hint">
          演示账号：student / student123<br />
          教师账号：teacher / teacher123 · 管理员：admin / admin123
        </div>
      </form>
    </div>
  );
}
