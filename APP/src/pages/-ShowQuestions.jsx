import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { API_URL } from '../components/Urls';
import { getCsrfToken } from '../utils/csrfUtils';

const ShowQuestions = ({ id }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [score, setScore] = useState(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await fetch(`${API_URL}/quiz/${id}/questions`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': await getCsrfToken()
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch questions');
                }
                const data = await response.json();
                setQuestions(data.questions);                
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [id]);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await fetch(`${API_URL}/quiz/${id}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': await getCsrfToken()
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch quiz');
                }
                const data = await response.json();
                setTitle(data.quiz.title);
            } catch (error) {
                toast.error(error.message);
            }
        };

        fetchQuiz();
    }
    , [id]);

    const handleAnswerChange = (questionId, answerId) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: answerId
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let totalScore = 0;
        questions.forEach((question) => {
            const selectedAnswerId = selectedAnswers[question.id];
            const correctAnswer = question.answers.find((answer) => answer.is_correct);
            if (correctAnswer && correctAnswer.id === selectedAnswerId) {
                totalScore += question.score;
            }
        });
        setScore(totalScore);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <hr />
            <h1 className="badge bg-info fs-3 mt-5 mb-3">Questions for Quiz: {title}</h1>
            <form onSubmit={handleSubmit}>
                {questions.length === 0 ? (
                    <p>No questions available.</p>
                ) : (
                    <ul className="list-unstyled">
                        {questions.map((question) => (
                            <li key={question.id} className="mb-5">
                                <h2>{question.text}</h2>
                                <ul>
                                    {question.answers.map((answer) => (
                                        <li key={answer.id}>
                                            <input
                                                type="checkbox"
                                                value={answer.id}
                                                checked={selectedAnswers[question.id] === answer.id}
                                                onChange={() => handleAnswerChange(question.id, answer.id)}
                                            />
                                            {answer.text}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}
                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
            {score !== null && (
                <div className="mt-3">
                    <h2>Your Score: {score}</h2>
                </div>
            )}
        </div>
    );
};

export default ShowQuestions;


