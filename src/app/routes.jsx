import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import EditProfile from './pages/EditProfile';
import NotFound from './pages/NotFound';

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
    path: '/profile/:id',
    element: <Profile />
  },
  {
    path: '/profile',
    element: <Profile />
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
