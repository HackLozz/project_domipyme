import React, {useState} from 'react'
import api from '../components/Api'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('auth/register/', { email, password });
      nav('/login');
    } catch (err){
      setError('Error en registro');
    }
  }

  return (
    <div>
      <h2>Registro</h2>
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
        <button className="btn" type="submit">Crear cuenta</button>
      </form>
    </div>
  )
}
