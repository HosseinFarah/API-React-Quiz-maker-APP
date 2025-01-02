import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../Components/Urls";
import { PacmanLoader } from "react-spinners";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { deleteQuiz } from "../utils/csrfUtils";
import QuizResults from "./QuizResults";

const Quiz = () => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useContext(AuthContext);
  const [savedAnswers, setSavedAnswers] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`${API_URL}/quiz/${id}`);
        console.log("response:", response); // Debug log

        const data = await response.json();
        setQuiz(data.quiz);
        setLoading(false);
        const savedAnswers = localStorage.getItem(`quiz_${id}_answers`);
        setSavedAnswers(savedAnswers);
      } catch (error) {
        console.error("Error fetching quiz:", error);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleDeleteQuiz = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quiz?"
    );
    if (confirmed) {
      await deleteQuiz(id, navigate)();
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: "150px" }}>
        <div className="row d-flex justify-content-center">
          <PacmanLoader color={"#123abc"} loading={loading} size={50} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container" style={{ marginTop: "150px" }}>
        <div className="row d-flex justify-content-start">
          <div className="col-md-12">
            <h2 className="badge bg-secondary fs-3">Quiz: {quiz.title}</h2>
            <hr />
            <img
              src={`http://localhost:5000/static/uploads/quizzes/${quiz.image}`}
              className="img-fluid rounded mb-3 shadow-lg"
              style={{ maxHeight: "200px" }}
              alt={quiz.title}
            />
            <hr className="text-primary" />
            <p className="text-wrap" style={{ textAlign: "justify" }}>
              <i className="fas fa-info-circle text-secondary fs-4"></i>{" "}
              {quiz.description}
            </p>
            <p className="text-wrap">
              <i className="fas fa-user-clock text-danger fs-4"></i> Attempt:{" "}
              {quiz.attempt}
            </p>
            <p className="text-wrap">
              <i className="fas fa-calendar-day text-success fs-4"></i> Start
              Date: {quiz.start_date}
            </p>
            <p className="text-wrap">
              <i className="fas fa-calendar-day text-info fs-4"></i> End Date:{" "}
              {quiz.end_date}
            </p>
            <p className="text-wrap">
              <i className="fas fa-clock text-warning fs-4"></i> Time Limit:{" "}
              {quiz.time_limit} minutes
            </p>
            <p className="text-wrap">
                        <i className={`fas fa-check text-${new Date(quiz.end_date) > Date.now() ? 'success' : 'danger'}`}></i> Status:{" "}
                        <span style={{ textDecoration: new Date(quiz.end_date) > Date.now() ? 'none' : 'line-through' }}>
                          {quiz.status}
                        </span>
                      </p>
            <p className="text-wrap">
              <i className="fas fa-random text-info fs-4"></i> Shuffle:{" "}
              {quiz.shuffle_questions ? "Yes" : "No"}
            </p>
            <hr className="text-primary" />

            {isAdmin && (
              <>
                <Link
                  to={`/quiz/${quiz.id}/add_question`}
                  className="btn btn-primary"
                >
                  Add Question
                </Link>
                <Link
                  to={`/quiz/edit/${quiz.id}`}
                  className="btn btn-primary ms-2"
                >
                  Edit Quiz
                </Link>
                <button
                  className="btn btn-danger ms-2"
                  onClick={() => handleDeleteQuiz(quiz.id)}
                >
                  Delete Quiz
                </button>
              </>
            )}
            <Link to="/" className="btn btn-secondary ms-2">
              Back
            </Link>
          </div>
        </div>
        <div className="row d-flex justify-content-center">
          {quiz.start_date &&
          new Date(quiz.start_date) <= new Date() &&
          new Date(quiz.end_date) >= new Date() ? (
            <Link
              to={`/quiz/${quiz.id}/submit`}
              className="btn btn-primary mt-3 w-25 shadow-lg fs-4 text-warning"
            >
              {savedAnswers ? "Continue Quiz" : "Start Quiz"}
            </Link>
          ) : null}
        </div>
        <QuizResults quizId={id} />
        {isAdmin && (
        <Link
          to={`/quiz/${quiz.id}/results`}
          className="btn btn-primary mt-3 w-25 shadow-lg fs-4 text-warning"
        >
          View Results
        </Link>
        )}
      </div>
    </>
  );
};

export default Quiz;
