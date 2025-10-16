import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute"; // harusnya ini wrapper, jangan dari AdminDashboard
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import CreateVoting from "./components/CreateVoting";
import VotingResults from "./components/VotingResults";
import EditUsers from "./components/EditUsers";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            {/* Nested routes untuk admin */}
            <Route path="create-voting" element={<CreateVoting />} />
            <Route path="results" element={<VotingResults />} />
            <Route path="users" element={<EditUsers />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
