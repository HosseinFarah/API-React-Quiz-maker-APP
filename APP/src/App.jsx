import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import ResendConfirmation from './pages/ResendConfirmation';
import Confirm from './pages/Confirm';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, AdminRoute, UnLogedInRoute } from './components/PrivateRoute';
import RegisterForm from './pages/RegisterForm'; // Fix the import path
import ResetPasswordRequest from './pages/ResetPasswordRequest';
import ResetPassword from './pages/ResetPassword';
import CreateQuiz from './pages/CreateQuiz';
import Quiz from './pages/Quiz';
import EditQuiz from './pages/EditQuiz';
import AddQuestion from './pages/AddQuestion';
import ShowQuestions from './pages/-ShowQuestions';
import SubmitQuestion from './pages/SubmitQuestion';
import QuizResultsAll from './pages/QuizResulusAll';
import EditQuestion from './pages/EditQuestion';
import ViewResult from './pages/ViewResult';
import AllUsers from './pages/AllUsers';
import EditUser from './pages/EditUser';

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<UnLogedInRoute><Login /></UnLogedInRoute>} />
        <Route path="register" element={<RegisterForm />} />
        <Route path="resend-confirmation" element={<ResendConfirmation />} />
        <Route path="confirm" element={<Confirm />} />
        <Route path="confirm/:token" element={<Confirm />} />
        <Route path="reset_password_request" element={<ResetPasswordRequest />} /> {/* Add route for reset password request */}
        <Route path="reset_password/:token" element={<ResetPassword />} /> {/* Ensure this route is defined */}
        <Route path="reset_password" element={<ResetPassword />} /> {/* Adjust route if using query parameters */}
        <Route path="create_quiz" element={<AdminRoute><CreateQuiz /></AdminRoute>} />
        <Route path="quiz/:id" element={<PrivateRoute><Quiz /></PrivateRoute>} />
        <Route path="quiz/edit/:id" element={<AdminRoute><EditQuiz /></AdminRoute>} />
        <Route path="quiz/:quizId/add_question" element={<AdminRoute><AddQuestion /></AdminRoute>} />
        <Route path="quiz/:quizId/questions" element={<PrivateRoute><ShowQuestions /></PrivateRoute>} />
        <Route path="quiz/:id/submit" element={<PrivateRoute><SubmitQuestion /></PrivateRoute>} />
        <Route path="quiz/:quizId/results" element={<AdminRoute><QuizResultsAll /></AdminRoute>} />
        <Route path="quiz/:quiz_id/edit_question/:question_id" element={<AdminRoute><EditQuestion /></AdminRoute>} />
        <Route path="quiz/:quiz_id/results/:result_id" element={<AdminRoute><ViewResult /></AdminRoute>} />
        <Route path="all_users" element={<AdminRoute><AllUsers /></AdminRoute>} />
        <Route path="edit_user/:userId" element={<AdminRoute><EditUser /></AdminRoute>} />
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