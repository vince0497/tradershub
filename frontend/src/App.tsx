import './App.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { Toaster } from './components/ui/toast'
import UserAuthProvider from './context/userAuthContext'

function App() {
  return (

    <UserAuthProvider>
    <Toaster>
      <RouterProvider router={router} />
    </Toaster>
    </UserAuthProvider>
  )
}

export default App
