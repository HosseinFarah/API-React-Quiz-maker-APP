import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCsrfToken, getCsrfToken } from "../utils/csrfUtils";
import { API_URL, IMAGE_URL } from "../components/Urls";
import { toast } from "react-toastify";

const EditQuestion = () => {
  const { quiz_id, question_id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, control, setValue, reset } = useForm();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });
  console.log("fields:", fields);
  
  const [questionImage, setQuestionImage] = useState(null);
  const [currentQuestionImage, setCurrentQuestionImage] = useState(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch(
          `${API_URL}/quiz/${quiz_id}/questions/${question_id}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await response.json();
        if (response.ok) {
          reset(data.question);
          setCurrentQuestionImage(data.question.image);
          data.question.answers.forEach((answer, index) => {
            setValue(`answers[${index}].currentImage`, answer.image);
          });
        } else {
          throw new Error(data.message || "Failed to fetch question");
        }
      } catch (error) {
        console.error("Error fetching question:", error);
        toast.error("Failed to fetch question");
      }
    };

    fetchQuestion();
  }, [quiz_id, question_id, reset, setValue]);

  const onSubmit = async (formData) => {
    try {
      const csrfToken = await getCsrfToken();
      const form = new FormData();
      form.append("text", formData.text);
      form.append("format", formData.format);
      form.append("options_format", formData.options_format);
      form.append("score", formData.score);
      form.append("shuffle_enabled", formData.shuffle_enabled);

      if (questionImage) {
        form.append("image", questionImage);
      } else {
        form.append("currentImage", currentQuestionImage);
      }

      formData.answers.forEach((answer, index) => {
        form.append(`answers[${index}][text]`, answer.text);
        form.append(`answers[${index}][is_correct]`, answer.is_correct);
        form.append(`answers[${index}][answer_id]`, answer.id); // Include answer_id
        if (answer.image) {
          form.append(`answers[${index}][image]`, answer.image[0]);
        } else {
          form.append(`answers[${index}][currentImage]`, answer.currentImage);
        }
      });

      const response = await fetch(
        `${API_URL}/quiz/${quiz_id}/questions/${question_id}`,
        {
          method: "PUT",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: form,
        }
      );

      const result = await response.json();
      if (response.ok) {
        toast.success("Question updated successfully");
        navigate(`/quiz/${quiz_id}/submit`);
      } else {
        throw new Error(result.message || "Failed to update question");
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Failed to update question");
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            encType="multipart/form-data"
            className="form"
            style={{ marginTop: "150px" }}
          >
            <div className="mb-3">
              <label htmlFor="text" className="form-label">Question Text</label>
              <textarea {...register("text")} className="form-control" />
            </div>
            <div className="mb-3">
              <label htmlFor="format" className="form-label">Format</label>
              <select {...register("format")} className="form-select">
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="options_format" className="form-label">Options Format</label>
              <select {...register("options_format")} className="form-select">
                <option value="A,B,C,D">A,B,C,D</option>
                <option value="1,2,3,4">1,2,3,4</option>
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="score" className="form-label">Score</label>
              <input type="number" {...register("score")} className="form-control" />
            </div>
            <div className="mb-3 form-check">
              <input type="checkbox" {...register("shuffle_enabled")} className="form-check-input" />
              <label htmlFor="shuffle_enabled" className="form-check-label">Shuffle Enabled</label>
            </div>
            <div className="mb-3">
              <label htmlFor="questionImage" className="form-label">Question Image</label>
              <input
                type="file"
                onChange={(e) => setQuestionImage(e.target.files[0])}
                className="form-control"
              />
              {currentQuestionImage && !questionImage && (
                <img
                  src={`${IMAGE_URL}${currentQuestionImage}`}
                  alt="Current Question"
                  className="img-thumbnail mt-2 rounded"
                  style={{ width: "200px" }}
                />
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Answers</label>
              {fields.map((field, index) => (
                <div key={field.id} className="mb-3">
                  <input
                    {...register(`answers[${index}].text`)}
                    defaultValue={field.text}
                    className="form-control mb-2"
                  />
                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      {...register(`answers[${index}].is_correct`)}
                      defaultChecked={field.is_correct}
                      className="form-check-input"
                    />
                    <label className="form-check-label">Correct</label>
                  </div>
                  <input type="file" {...register(`answers[${index}].image`)} className="form-control mb-2" />
                  {field.image && (
                    <img
                      src={`${IMAGE_URL}${field.image}`}  // Ensure the correct path
                      alt={`Answer ${index + 1}`}
                      className="img-thumbnail mb-2 rounded"
                      style={{ width: "200px" }}
                    />
                  )}
                  <button type="button" onClick={() => remove(index)} className="btn btn-danger">
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => append({})} className="btn btn-primary">
                Add Answer
              </button>
            </div>
            <button type="submit" className="btn btn-success">Update Question</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditQuestion;
