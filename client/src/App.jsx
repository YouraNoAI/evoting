import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Votings from "./pages/Voting";
import User from "./pages/User";

import VotingResults from "./components/VotingResult";
import EditUsers from "./components/UserSetings";
import VotingSettings from "./components/VotingSetings";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login */}
          <Route path="/" element={<Login />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route path="voting-settings" element={<VotingSettings />} />
            <Route path="user-settings" element={<EditUsers />} />
          </Route>
          <Route path="voting/:id" element={
            // <ProtectedRoute>
            <VotingResults />
            // </ProtectedRoute>
          }
          />

          {/* User routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <User />
              </ProtectedRoute>
            }
          />
          <Route
            path="/select-voting/:id"
            element={
              <ProtectedRoute>
                <Votings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
