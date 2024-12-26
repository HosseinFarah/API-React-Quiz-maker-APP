import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { getCsrfToken } from "../utils/csrfUtils";
import { API_URL } from "../components/Urls";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

const SubmitQuestion = () => {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/quiz/${id}/questions`)
      .then((response) => response.json())
      .then((data) => {
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch((error) => {
        setErrorState(error);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`${API_URL}/quiz/${id}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": await getCsrfToken(),
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch quiz");
        }
        const data = await response.json();
        setTitle(data.quiz.title);
      } catch (error) {
        toast.error(error.message);
      }
    };

    fetchQuiz();
  }, [id]);

  const onSubmit = async (data) => {
    try {
      console.log("Submitting data:", data); // Add logging
      const csrfToken = await getCsrfToken(); 
      const user_id = user.id;
      const end_time = new Date().toISOString();
      const formattedData = {
        user_id,
        end_time,
        questions: await Promise.all(Object.keys(data).map(async (questionId) => {
          const response = await fetch(`${API_URL}/answers/${questionId}`);
          const answersData = await response.json();
          console.log("Answers data:", answersData); // Add logging
          const answers = answersData.answers;
          const selectedAnswerId = parseInt(data[questionId]);
          const isCorrect = answers.some(answer => answer.id === selectedAnswerId && answer.is_correct);
          return {
            question_id: parseInt(questionId),
            answers: [
              { answer_id: selectedAnswerId, is_correct: isCorrect },
            ],
          };
        })),
      };

      console.log("Formatted data:", formattedData); // Add logging

      const response = await fetch(`${API_URL}/quiz/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit quiz");
      }

      const result = await response.json();
      console.log("Submission result:", result); // Add logging
      alert(`Quiz submitted successfully! Your score: ${result.score}`);
      navigate("/"); // Redirect to home or another page
    } catch (error) {
      console.error("Error submitting quiz:", error); // Add logging
      setErrorState(error);
      if (error.response && error.response.data) {
        const responseErrors = error.response.data.errors;
        if (responseErrors) {
          Object.keys(responseErrors).forEach((key) => {
            setError(key, { type: "manual", message: responseErrors[key] });
          });
        }
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mt-5">
      <div className="row d-flex justify-content-start">
        <div className="col-md-12">
          <h1 className="badge bg-secondary fs-3">Submit Quiz: {title}</h1>
          <hr />
          <form onSubmit={handleSubmit(onSubmit)} className="form">
            {questions.map((question) => (
              <div key={question.id} className="mb-3">
                <h3>{question.text}</h3>
                {question.answers.map((answer) => (
                  <div key={answer.id} className="form-check">
                    <input
                      type="radio" // Changed from checkbox to radio
                      name={String(question.id)}
                      className="form-check-input"
                      value={answer.id}
                      {...register(String(question.id), {
                        required: "This question is required",
                      })}
                    />
                    <span className="ms-2">{answer.text}</span>
                  </div>
                ))}
                {errors[question.id] && <p>{errors[question.id].message}</p>}
              </div>
            ))}
            <button type="submit">Submit Quiz</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitQuestion;
