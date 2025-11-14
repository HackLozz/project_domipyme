import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom'
import api from '../components/Api'

export default function ShopPage(){
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(()=>{
    const load = async () => {
      try {
        const res = await api.get(`shops/${slug}/`);
        setShop(res.data.shop || res.data);
        setProducts(res.data.products || res.data.products || []);
      } catch(e){
        console.error(e);
      }
    }
    load();
  }, [slug]);

  if(!shop) return <div>Cargando tienda...</div>;

  return (
    <div>
      <h2>{shop.name}</h2>
      <p>{shop.description}</p>
      <h3>Productos</h3>
      <ul>
        {products.map(p=>(
          <li key={p.id}>
            <strong>{p.name}</strong> - {p.price} COP
            <div><button onClick={()=> {
              const cart = JSON.parse(localStorage.getItem('dp_cart') || '[]');
              cart.push({ product: p.id, shop: shop.id, name: p.name, price: p.price, qty: 1 });
              localStorage.setItem('dp_cart', JSON.stringify(cart));
              alert('Producto agregado al carrito');
            }}>Agregar</button></div>
          </li>
        ))}
      </ul>
    </div>
  )
}
