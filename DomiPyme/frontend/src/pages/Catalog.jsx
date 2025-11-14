import React, {useEffect, useState} from 'react'
import api from '../components/Api'
import { Link } from 'react-router-dom'

export default function Catalog(){
  const [shops, setShops] = useState([]);
  useEffect(()=>{
    const load = async () => {
      try {
        const res = await api.get('shops/');
        setShops(res.data);
      } catch(e){ console.error(e) }
    }
    load();
  }, []);
  return (
    <div>
      <h2>Catálogo de Comercios</h2>
      <ul>
        {shops.map(s=>(
          <li key={s.id}><Link to={`/shop/${s.slug}`}>{s.name}</Link></li>
        ))}
      </ul>
    </div>
  )
}
