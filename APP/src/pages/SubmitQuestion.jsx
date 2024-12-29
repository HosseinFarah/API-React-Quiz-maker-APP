import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getCsrfToken } from "../utils/csrfUtils";
import { API_URL,IMAGE_URL } from "../components/Urls";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

const SubmitQuestion = () => {
    const { user,isAdmin } = useContext(AuthContext);
    const { id } = useParams();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState(null);
  const [title, setTitle] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [quiz, setQuiz] = useState(null); // Add state for quiz
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState(null); // Add state for start time

  // SHUFFLE FOR QUESTIONS
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  // SHUFFLE FOR QUESTIONS and Answers
  useEffect(() => {
    fetch(`${API_URL}/quiz/${id}/questions`)
      .then((response) => response.json())
      .then((data) => {
        const shuffledQuestions = data.questions.map((question) => {
          if (question.shuffle_enabled) {
            question.answers = shuffleArray(question.answers);
          }
          // Format answers based on options_format(eg. A,B,C,D or 1,2,3,4)
          question.answers = question.answers.map((answer, index) => {
            const format = question.options_format.split(",")[index];
            return { ...answer, format };
          });
          return question;
        });
        setQuestions(shuffledQuestions);
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
        setQuiz(data.quiz); // Set quiz data
        const savedStartTime = localStorage.getItem(`quiz_${id}_start_time`);
        const currentTime = new Date().getTime();
        if (!savedStartTime) {
          const startTime = currentTime;
          localStorage.setItem(`quiz_${id}_start_time`, startTime);
          setStartTime(startTime); // Set start time
          setTimer(data.quiz.time_limit * 60); // Convert minutes to seconds
        } else {
          const elapsedTime = Math.floor((currentTime - parseInt(savedStartTime)) / 1000);
          const remainingTime = data.quiz.time_limit * 60 - elapsedTime;
          setTimer(remainingTime > 0 ? remainingTime : 0);
          setStartTime(parseInt(savedStartTime)); // Set start time
        }
        console.log("Timer:", data.quiz.time_limit * 60); // Add logging
        localStorage.removeItem(`quiz_${id}_answers`); // Clear saved answers for new attempt
      } catch (error) {
        toast.error(error.message);
      }
    };

    fetchQuiz();
  }, [id]);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const response = await fetch(`${API_URL}/quiz/${id}/attempts`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": await getCsrfToken(),
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch attempts");
        }
        const data = await response.json();
        setAttempts(data.attempts);
      } catch (error) {
        toast.error(error.message);
      }
    };

    fetchAttempts();
  }, [id]);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0 && quiz) {
      handleSubmit(onSubmit)();
    }
  }, [timer, quiz]);

  // SHUFFLE FOR QUESTIONS
  useEffect(() => {
    if (quiz && quiz.shuffle_questions) {
      setQuestions((prevQuestions) => shuffleArray([...prevQuestions]));
    }
  }, [quiz]);

  const saveAnswers = (data) => {
    localStorage.setItem(`quiz_${id}_answers`, JSON.stringify(data));
    toast.success("Answers saved successfully!");
  };

  useEffect(() => {
    const savedAnswers = localStorage.getItem(`quiz_${id}_answers`);
    if (savedAnswers) {
      const parsedAnswers = JSON.parse(savedAnswers);
      Object.keys(parsedAnswers).forEach((key) => {
        setValue(key, parsedAnswers[key]);
      });
    }
  }, [id, setValue]);

  const onSubmit = async (data) => {
    try {
      if (quiz && attempts >= quiz.attempt) {
        alert("You have reached the maximum number of attempts for this quiz.");
        return;
      }
      console.log("Submitting data:", data); // Add logging
      const csrfToken = await getCsrfToken(); 
      const user_id = user.id;
      const end_time = new Date().toISOString();
      const duration = Math.floor((new Date().getTime() - startTime) / 1000); // Calculate duration
      const formattedData = {
        user_id,
        end_time,
        duration, // Include duration
        questions: await Promise.all(Object.keys(data).map(async (questionId) => {
          const response = await fetch(`${API_URL}/answers/${questionId}`);
          const answersData = await response.json();
          console.log("Answers data:", answersData); // Add logging
          const answers = answersData.answers;
          const selectedAnswerId = data[questionId] ? parseInt(data[questionId]) : null;
          const isCorrect = selectedAnswerId !== null && answers.some(answer => answer.id === selectedAnswerId && answer.is_correct);
          return {
            question_id: parseInt(questionId),
            answers: selectedAnswerId !== null ? [
              { answer_id: selectedAnswerId, is_correct: isCorrect },
            ] : [],
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
      setAttempts(attempts + 1); // Increment attempts
      console.log("Submission result:", result); // Add logging
      toast.success(`Quiz submitted successfully! Your score: ${result.overall_score}`);
      setStartTime(0); // Reset start time
      localStorage.removeItem(`quiz_${id}_start_time`); // Clear start time from local storage
      localStorage.removeItem(`quiz_${id}_answers`); // Clear saved answers after submission
      navigate(`/quiz/${id}`);
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
    <div className="container mt-5" style={{ marginTop: "180px" }}>
      <div className="row d-flex justify-content-start">
        <div className="col-md-12">
          <h1 className="badge bg-secondary fs-3">Submit Quiz: {title}</h1>
          <p className="fs-5 mt-5">Remaining attempts: {quiz ? quiz.attempt - attempts : 0}</p>
          {quiz && attempts < quiz.attempt ? (
            <div className="row d-flex justify-content-end">
               <span className="badge bg-danger fs-4 text-start shadow-lg flex-inline w-50">Time remaining: {Math.floor(timer / 60)}:{timer % 60 < 10 ? `0${timer % 60}` : timer % 60} minutes </span> 
            </div>
          ) : null}
          <hr />
          {quiz && attempts < quiz.attempt ? (
          <form onSubmit={handleSubmit(onSubmit)} className="form">
            {questions.map((question) => (
              <div key={question.id} className="mb-3">
                <h3>{question.text}</h3>
                <img src={question.image ? `${IMAGE_URL}${question.image}` : ""} alt="Question" className="img-fluid rounded" style={{ maxHeight: "200px" }} />
                {question.answers.map((answer) => (
                  <>
                  <hr />
                  <div key={answer.id} className="form-check mt-3">
                    <input
                      type="radio"
                      name={String(question.id)}
                      className="form-check-input"
                      value={answer.id}
                      {...register(String(question.id))}
                    />
                    <div className="row">
                    <div className="col-md-3">
                    <span className="ms-2">{answer.format}. {answer.text}</span>
                    </div>
                    <div className="col-md-4">
                      {answer.image &&
                    <span><img src={answer.image ? `${IMAGE_URL}${answer.image}` : ""} alt="Answer" className="img-fluid rounded" style={{ maxHeight: "200px" }} /></span>
                    }
                    </div>
                    </div>
                  </div>
                  </>
                ))}
                {errors[question.id] && <p>{errors[question.id].message}</p>}
                {isAdmin && (
                  <Link to={`/quiz/${id}/edit_question/${question.id}`} className="btn btn-primary me-2">Edit Question</Link>
                )}
              </div>
            ))}

            <div className="d-flex justify-content-end">
              <button type="button" onClick={handleSubmit(saveAnswers)} className="btn btn-primary me-2">Save Answers</button>
              <button type="submit" className="btn btn-success">Submit Quiz</button>
            </div>

          </form>
            ) : (
                <p>You have reached the maximum number of attempts for this quiz.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default SubmitQuestion;

// ...existing code...
