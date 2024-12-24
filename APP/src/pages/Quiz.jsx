import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../Components/Urls";
import { PacmanLoader } from "react-spinners";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { deleteQuiz } from "../utils/csrfUtils";
import { use } from "react";

const Quiz = () => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useContext(AuthContext);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`${API_URL}/quiz/${id}`);
        console.log("response:", response); // Debug log

        const data = await response.json();
        setQuiz(data.quiz);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quiz:", error);
      }
    };
    fetchQuiz();
  }, [id]);

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
        <div className="row d-flex justify-content-center">
          <div className="col-md-6">
            <h2 className="badge bg-secondary fs-3">Quiz: {quiz.title}</h2>
            <hr />
            <img
              src={`http://localhost:5000/static/uploads/quizzes/${quiz.image}`}
              className="img-fluid rounded mb-3 shadow-md"
              style={{ maxHeight: "200px" }}
              alt={quiz.title}
            />
            <p>{quiz.description}</p>
            <p>Capacity: {quiz.capacity}</p>
            <p>Start Date: {quiz.start_date}</p>
            <p>Time Limit: {quiz.time_limit} minutes</p>
            <p>Status: {quiz.status}</p>
            <p>Shuffle: {quiz.shuffle_questions ? "Yes" : "No"}</p>
            <Link to={`/quiz/${quiz.id}/start`} className="btn btn-primary">
              Start Quiz
            </Link>
            {isAdmin && (
              <Link
                to={`/quiz/edit/${quiz.id}`}
                className="btn btn-primary ms-2"
              >
                Edit Quiz
              </Link>
            )}
            <Link to="/" className="btn btn-secondary ms-2">
              Back
            </Link>
            <button
              className="btn btn-danger ms-2"
              onClick={deleteQuiz(quiz.id, navigate)}
            >
              Delete Quiz
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Quiz;
