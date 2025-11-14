import React, {useState} from 'react'
import api from '../components/Api'
import { useNavigate } from 'react-router-dom'

export default function ShopCreate(){
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const nav = useNavigate();
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('shops/', { name, description, slug: name.toLowerCase().replace(/\s+/g,'-') });
      nav(`/shop/${res.data.slug}`);
    } catch (err){
      setError('Error creando la tienda');
    }
  }

  return (
    <div>
      <h2>Crear Tienda</h2>
      <form onSubmit={submit}>
        <div>
          <label>Nombre</label><br/>
          <input value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label>Descripción</label><br/>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        {error && <div style={{color:'red'}}>{error}</div>}
        <button className="btn" type="submit">Crear</button>
      </form>
    </div>
  )
}
