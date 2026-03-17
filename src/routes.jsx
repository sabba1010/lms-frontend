import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import ChildrenPage from './pages/ChildrenPage';
import AdultPage from './pages/AdultPage';
import MembershipPage from './pages/MembershipPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CourseDetailPage from './pages/CourseDetailPage';
import StudentDashboard from './pages/StudentDashboard';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import ScormPlayerPage from './pages/ScormPlayerPage';
import ProtectedRoute from './components/ProtectedRoute';


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/courses/children" element={<ChildrenPage />} />
        <Route path="/courses/adult" element={<AdultPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/company-dashboard" element={<ProtectedRoute allowedRoles={['company']}><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        {/* SCORM player — opens the extracted SCORM package in an iframe */}
        <Route path="/scorm-player/:courseId" element={<ProtectedRoute><ScormPlayerPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
};


export default AppRoutes;
