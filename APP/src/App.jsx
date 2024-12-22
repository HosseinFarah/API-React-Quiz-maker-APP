import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Todos from './pages/Todos';
import HandleTodo from './Components/HandleTodo';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import ResendConfirmation from './pages/ResendConfirmation';
import Confirm from './pages/confirm';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, AdminRoute, UnLogedInRoute } from './Components/PrivateRoute';
import RegisterForm from './pages/---RegisterForm';
import ResetPasswordRequest from './pages/ResetPasswordRequest'; // Import ResetPasswordRequest component
import ResetPassword from './pages/ResetPassword'; // Import ResetPassword component

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="todos" element={<PrivateRoute><Todos /></PrivateRoute>} />
        <Route path="newtodo" element={<AdminRoute><HandleTodo /></AdminRoute>} />
        <Route path="login" element={<UnLogedInRoute><Login /></UnLogedInRoute>} />
        <Route path="register" element={<RegisterForm />} />
        <Route path="resend-confirmation" element={<ResendConfirmation />} />
        <Route path="confirm" element={<Confirm />} />
        <Route path="confirm/:token" element={<Confirm />} />
        <Route path="reset_password_request" element={<ResetPasswordRequest />} /> {/* Add route for reset password request */}
        <Route path="reset_password/:token" element={<ResetPassword />} /> {/* Ensure this route is defined */}
        <Route path="reset_password" element={<ResetPassword />} /> {/* Adjust route if using query parameters */}
        <Route path="*" element={<NotFound />} />
      </Route>
    )
  );
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;