import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
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
            <Route path="results" element={<VotingResults />} />
            <Route path="users" element={<EditUsers />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
