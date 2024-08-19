import {
  BrowserRouter,
  Route,
  Routes
} from "react-router-dom"
import './App.css'

function App() {
  return (
    <>
       <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/update" element={<Update />} />
          <Route path="/" element={<Homepage />} />
          <Route path="/message/:id" element={<SendMessage />} />
          <Route path="/all-messages" element={<MessageAllUser />} />
          <Route path="/all-messages/:id" element={<MessageSameUser />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
