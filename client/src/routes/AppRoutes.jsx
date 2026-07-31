import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import About from '../pages/About.jsx';
import AddProperty from '../pages/AddProperty.jsx';
import Contact from '../pages/Contact.jsx';
import EditProperty from '../pages/EditProperty.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import NotFound from '../pages/NotFound.jsx';
import OwnerDashboard from '../pages/OwnerDashboard.jsx';
import Properties from '../pages/Properties.jsx';
import PropertyDetails from '../pages/PropertyDetails.jsx';
import Profile from '../pages/Profile.jsx';
import Register from '../pages/Register.jsx';
import RoleAccess from '../pages/RoleAccess.jsx';
import SystemStatus from '../pages/SystemStatus.jsx';
import Unauthorized from '../pages/Unauthorized.jsx';

function AppRoutes() {
  const showDevelopmentRoutes = import.meta.env.DEV;

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/:id" element={<PropertyDetails />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="unauthorized" element={<Unauthorized />} />
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
          <Route path="owner/dashboard" element={<OwnerDashboard />} />
          <Route path="owner/properties/add" element={<AddProperty />} />
          <Route path="owner/properties/edit/:id" element={<EditProperty />} />
          <Route path="owner-access" element={<RoleAccess role="owner" />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="admin-access" element={<RoleAccess role="admin" />} />
        </Route>
        {showDevelopmentRoutes && (
          <Route path="system-status" element={<SystemStatus />} />
        )}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
