import React, {useState, useEffect} from 'react'
import { Link } from 'react-router-dom'

export default function Cart(){
  const [items, setItems] = useState([]);
  useEffect(()=> {
    setItems(JSON.parse(localStorage.getItem('dp_cart') || '[]'));
  },[]);
  const total = items.reduce((s,i)=> s + (Number(i.price) * (i.qty||1)), 0);
  return (
    <div>
      <h2>Carrito</h2>
      <ul>
        {items.map((it, idx)=>(
          <li key={idx}>{it.name} - {it.price} x {it.qty || 1}</li>
        ))}
      </ul>
      <div>Total: {total} COP</div>
      <Link to="/checkout" className="btn">Ir a pagar</Link>
    </div>
  )
}
