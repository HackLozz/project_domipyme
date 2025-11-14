import React from 'react'
import { Link } from 'react-router-dom'

export default function Header(){
  return (
    <header>
      <div style={{maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div>
          <Link to="/"><strong>DomiPyme</strong></Link>
        </div>
        <nav>
          <Link to="/">Catálogo</Link>
          <Link to="/shop/create">Crear Tienda</Link>
          <Link to="/cart">Carrito</Link>
          <Link to="/login">Entrar</Link>
        </nav>
      </div>
    </header>
  )
}
