import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import CommandCenter from './pages/CommandCenter';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectView from './pages/ProjectView';
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
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="archive" element={<Archive />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="command" element={<CommandCenter />} />
            <Route path="project/:projectId" element={<ProjectView />} />
            <Route path="project/:projectId/document/:docId" element={<DocumentEditor />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
