import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DemoDashboard from './pages/DemoDashboard';
import DocumentEditor from './pages/DocumentEditor';
import UserManagement from './pages/UserManagement';
import Inbox from './pages/Inbox';
import Archive from './pages/Archive';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          {/* Demo Route - No auth required */}
          <Route path="/demo" element={<DemoDashboard />} />

          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirects to demo */}
          <Route path="/" element={<Navigate to="/demo" replace />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="archive" element={<Archive />} />
            <Route path="users" element={<UserManagement />} />
            {/* Note: DocumentEditor is kept but technically legacy until integrated into the new stream */}
            <Route path="document/:docId" element={<DocumentEditor />} />
          </Route>

          <Route path="*" element={<Navigate to="/demo" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
