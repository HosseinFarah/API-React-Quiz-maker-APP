import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { API_URL } from "../Components/Urls";
import { useContext } from "react";
import { deleteQuiz } from "../utils/csrfUtils";
import QuizEvent from "../Components/QuizEvent";
import { PulseLoader } from "react-spinners";

const AllQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const { isAdmin, isConfirmed } = useContext(AuthContext); // Add isConfirmed
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_URL}/all_quizzes`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (
          response.status === 403 &&
          errorData.message === "User not confirmed"
        ) {
          navigate(`/confirm?token=${errorData.token}`); // Redirect to confirm page with token
          return;
        }
        throw new Error("Failed to fetch quizzes");
      }
      const data = await response.json();
      setQuizzes(data.quizzes);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      fetchQuizzes();
    } else {
      navigate("/confirm"); // Redirect to confirm page if not confirmed
    }
  }, [isConfirmed, navigate]);

  const handleDeleteQuiz = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quiz?"
    );
    if (confirmed) {
      await deleteQuiz(id, navigate)();
      setQuizzes(quizzes.filter((quiz) => quiz.id !== id));
    } else {
      setQuizzes([...quizzes]); // Force rerender by updating state
    }
  };

  return (
    <>
      <div className="container" style={{ marginTop: "120px" }}>
        <div className="row d-flex justify-content-center">
        {loading && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
              <PulseLoader color="#0d6efd" loading={loading} size={50} />
            </div>
          )}
          <div className="col-md-4">
            {isAdmin && (
              <Link
                className="btn btn-primary mb-3"
                style={{ marginTop: "120px" }}
                to="/create_quiz"
              >
                <FaPlus /> Add New Quiz
              </Link>
            )}
          </div>
        </div>
        <div className="row d-flex justify-content-center">
            {quizzes.map(
              (quiz) =>
                quiz.status === "available" && (
                  <div
                    key={quiz.id}
                    className="col-sm-12 col-md-6 col-lg-6 col-xl-4"
                  >
                    <div className="card mb-4 border-none shadow-lg p-3 mb-5 bg-white rounded">
                      <img
                        src={`http://localhost:5000/static/uploads/quizzes/${quiz.image}`}
                        className="card-img-top"
                        alt={quiz.title}
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                      <div className="card-header bg-info text-white">
                        <h5>
                          <i className="fas fa-book text-primary"></i>{" "}
                          {quiz.title}
                        </h5>
                      </div>
                      <div className="card-body">
                        <p className="text-justify" style={{ textAlign: "justify" }}>
                          <i className="fas fa-align-left text-primary"></i>{" "}
                          Description: {quiz.description}
                        </p>
                        <p>
                          <i className="fas fa-infinity text-danger"></i>{" "}
                          Attempts: {quiz.attempt}
                        </p>
                        <p>
                          <i className="fas fa-clock text-primary"></i> Time
                          Limit: {quiz.time_limit} minutes
                        </p>
                        <p>
                          <i className="fas fa-calendar-alt text-success"></i>{" "}
                          Start Date: {quiz.start_date}
                        </p>
                        <p>
                          <i className="fas fa-calendar-alt text-danger"></i>{" "}
                          End Date: {quiz.end_date}
                        </p>
                        <p>
                          <i
                            className={`fas fa-check text-${
                              new Date(quiz.end_date) > Date.now()
                                ? "success"
                                : "danger"
                            }`}
                          ></i>{" "}
                          Status:{" "}
                          <span
                            style={{
                              textDecoration:
                                new Date(quiz.end_date) > Date.now()
                                  ? "none"
                                  : "line-through",
                            }}
                          >
                            {quiz.status}
                          </span>
                        </p>
                        <p>
                          <i className="fas fa-random text-primary"></i>{" "}
                          Shuffle: {quiz.shuffle_questions ? "Yes" : "No"}
                        </p>

                        <div className="row d-flex justify-content-end">
                          <Link
                            key={quiz.id}
                            to={`/quiz/${quiz.id}`}
                            className="btn btn-success mt-2"
                          >
                            <i className="fas fa-info-circle"></i> Read More
                          </Link>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="card-footer">
                          <Link
                            to={`/quiz/edit/${quiz.id}`}
                            className="btn btn-secondary"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="btn btn-danger ms-2"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
            )}
            
         
        </div>
        <div className="row d-flex justify-content-center shadow-lg p-3 mb-5 bg-white rounded">
          <QuizEvent className="w-50" />

        </div>
        
      </div>
    </>
  );
};

export default AllQuizzes;
