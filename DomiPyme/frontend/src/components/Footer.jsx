import React from 'react'
export default function Footer(){
  return (
    <footer style={{textAlign:'center', padding:12, marginTop:24}}>
      DomiPyme - MVP © {new Date().getFullYear()}
    </footer>
  )
}
