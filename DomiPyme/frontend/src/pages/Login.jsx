import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../components/Api'

export default function Login(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('auth/token/', { email, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      nav('/');
    } catch (err) {
      setError('Credenciales inválidas');
    }
  }

  return (
    <div>
      <h2>Iniciar sesión</h2>
      <form onSubmit={submit}>
        <div>
          <label>Email</label><br/>
          <input value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label><br/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <div style={{color:'red'}}>{error}</div>}
        <button className="btn" type="submit">Entrar</button>
      </form>
    </div>
  )
}
