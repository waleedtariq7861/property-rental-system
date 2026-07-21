import { Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import About from '../pages/About.jsx';
import Contact from '../pages/Contact.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import NotFound from '../pages/NotFound.jsx';
import Properties from '../pages/Properties.jsx';
import Register from '../pages/Register.jsx';
import SystemStatus from '../pages/SystemStatus.jsx';

function AppRoutes() {
  const showDevelopmentRoutes = import.meta.env.DEV;

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="properties" element={<Properties />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        {showDevelopmentRoutes && (
          <Route path="system-status" element={<SystemStatus />} />
        )}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
