// Routes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Resume = lazy(() => import('./pages/Resume'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));
const Calendar = lazy(() => import ('./pages/Calendar'));
const Messenger = lazy(() => import ('./pages/Messenger'));
const Ai = lazy(() => import ('./pages/Ai'));
const Hub = lazy(() => import ('./pages/Hub'));
const Meeting = lazy(() => import ('./pages/Meeting'));
const Employee = lazy(() => import ('./pages/Employee'));
const Document = lazy(() => import ('./pages/Document'));

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/messenger" element={<Messenger />} />
      <Route path="/ai" element={<Ai />} />
      <Route path="/hub" element={<Hub />} />
      <Route path="/meeting" element={<Meeting />} />
      <Route path="/employee" element={<Employee />} />
      <Route path="/document" element={<Document />} />
      
      {/* 404 route */}
      <Route path="/404" element={
        <div className="error-page">
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for doesn't exist.</p>
        </div>
      } />
      
      {/* Redirect all unmatched routes to 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;