import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { API_URL } from "../Components/Urls";
import { useContext } from "react";
import { deleteQuiz } from "../utils/csrfUtils";

const AllQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const { isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_URL}/all_quizzes`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }
      const data = await response.json();
      setQuizzes(data.quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDeleteQuiz = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this quiz?");
    if (confirmed) {
      await deleteQuiz(id, navigate)();
      setQuizzes(quizzes.filter(quiz => quiz.id !== id));
    } else {
      setQuizzes([...quizzes]); // Force rerender by updating state
    }
  };

  return (
    <>
      {isAdmin && (
        <Link
          className="btn btn-primary ms-4"
          style={{ marginTop: "150px" }}
          to="/create_quiz"
        >
          <FaPlus /> Add New Quiz
        </Link>
      )}
      <div className="container" style={{ marginTop: "150px" }}>
        <div className="row d-flex justify-content-center">
          {quizzes.map((quiz) => (
            quiz.status === "available" && (
              <div key={quiz.id} className="col-sm-12 col-md-6 col-lg-6 col-xl-4">
                <div className="card mb-4">
                  <img
                    src={`http://localhost:5000/static/uploads/quizzes/${quiz.image}`}
                    className="card-img-top"
                    alt={quiz.title}
                  />
                  <div className="card-header">
                    <h5>{quiz.title}</h5>
                  </div>
                  <div className="card-body">
                    <p>{quiz.description}</p>
                    <p>Attempts: {quiz.attempt}</p>
                    <p>Time Limit: {quiz.time_limit} minutes</p>
                    <p>Status: {quiz.status}</p>
                    <p>Shuffle: {quiz.shuffle_questions ? "Yes" : "No"}</p>

                    <Link
                      key={quiz.id}
                      to={`/quiz/${quiz.id}`}
                      className="btn btn-primary"
                    >
                      Start Quiz
                    </Link>
                  </div>
                  {isAdmin && (
                    <div className="card-footer">
                      <Link to={`/quiz/edit/${quiz.id}`} className="btn btn-secondary">
                        Edit
                      </Link>
                      <button onClick={() => handleDeleteQuiz(quiz.id)} className="btn btn-danger ms-2">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </>
  );
};

export default AllQuizzes;
