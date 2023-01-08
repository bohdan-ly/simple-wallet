import { useState } from 'react'
import './App.css'
import { Wallet } from './components/Wallet'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1 className='glowing-text'>Welcome</h1>
      <div className="card">
        <Wallet />
      </div>

    </div>
  )
}

export default App
