import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import EditProfile from './pages/EditProfile';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import AdminPanel from './pages/AdminPanel';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy />
  },
  {
    path: '/terms',
    element: <TermsOfUse />
  },
  {
    path: '/admin',
    element: <AdminPanel />
  },
  {
    path: '/profile/:id',
    element: <Profile />
  },
  {
    path: '/profile',
    element: <Profile />
  },
  {
    path: '/chat',
    element: <Chat />
  },
  {
    path: '/chat/:userId',
    element: <Chat />
  },
  {
    path: '/edit-profile/:id',
    element: <EditProfile />
  },
  {
    path: '*',
    element: <NotFound />
  }
]);
