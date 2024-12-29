import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../components/Urls";
import { getCsrfToken } from "../utils/csrfUtils";

const EditQuestion = () => {
  const { quiz_id, question_id } = useParams();
  const navigate = useNavigate();
  const { register, control, handleSubmit, setValue } = useForm();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });
  const [questionImage, setQuestionImage] = useState(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch(
          `${API_URL}/quiz/${quiz_id}/questions/${question_id}`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        setValue("text", data.question.text);
        setValue("format", data.question.format);
        setValue("options_format", data.question.options_format);
        setValue("score", data.question.score);
        setValue("shuffle_enabled", data.question.shuffle_enabled);
        setQuestionImage(data.question.image);
        data.question.answers.forEach((answer) => append(answer));
      } catch (error) {
        console.error("Error fetching question:", error);
      }
    };
    fetchQuestion();
  }, [quiz_id, question_id, setValue, append]);

  const onSubmit = async (formData) => {
    try {
      console.log("Submitting form data:", formData); // Log form data
      const csrfToken = await getCsrfToken();
      const form = new FormData();
      form.append("text", formData.text);
      form.append("format", formData.format);
      form.append("options_format", formData.options_format);
      form.append("score", formData.score);
      form.append("shuffle_enabled", formData.shuffle_enabled);
      form.append("question_id", question_id);
      if (formData.image[0]) {
        form.append("image", formData.image[0]);
      }
      formData.answers.forEach((answer, index) => {
        if (answer.id !== 'undefined') {
          form.append(`answers[${index}][id]`, answer.id);
        }
        form.append(`answers[${index}][text]`, answer.text);
        form.append(`answers[${index}][is_correct]`, answer.is_correct);
        form.append(`answers[${index}][order_number]`, answer.order_number);
        form.append(`answers[${index}][question_id]`, answer.question_id);
        if (answer.image[0]) {
          form.append(`answers[${index}][image]`, answer.image[0]);
        }
      });

      const response = await fetch(
        `${API_URL}/quiz/${quiz_id}/update_question`,
        {
          method: "POST",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: form,
        }
      );

      if (response.ok) {
        toast.success("Question updated successfully");
        navigate(`/quiz/${quiz_id}`);
      } else {
        const result = await response.json();
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    }
  };

  return (
    <>
      <div className="container" style={{ marginTop: "150px" }}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          encType="multipart/form-data"
          noValidate
          className="form"
        >
          <div>
            <label htmlFor="text" className="form-label">
              Question Text
            </label>
            <input {...register("text")} className="form-control" />
          </div>
          <div>
            <label>Format</label>
            <input {...register("format")} />
          </div>
          <div>
            <label>Options Format</label>
            <input {...register("options_format")} />
          </div>
          <div>
            <label>Score</label>
            <input type="number" step="0.1" {...register("score")} />
          </div>
          <div>
            <label>Shuffle Enabled</label>
            <input type="checkbox" {...register("shuffle_enabled")} />
          </div>
          <div>
            <label>Question Image</label>
            <input type="file" {...register("image")} />
            {questionImage && (
              <img
                src={`http://localhost:5000/static/uploads/quizzes/${questionImage}`}
                alt="Question"
              />
            )}
          </div>
          <div>
            <label>Answers</label>
            {fields.map((field, index) => (
              <div key={field.id}>
                <input
                  {...register(`answers.${index}.text`)}
                  placeholder="Answer Text"
                />
                <input
                  type="checkbox"
                  {...register(`answers.${index}.is_correct`)}
                />
                <input type="file" {...register(`answers.${index}.image`)} />
                {field.image && (
                  <img
                    src={`http://localhost:5000/static/uploads/quizzes/${field.image}`}
                    alt="Answer"
                  />
                )}
                <button type="button" onClick={() => remove(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                append({ text: "", is_correct: false, image: null })
              }
            >
              Add Answer
            </button>
          </div>
          <button type="submit">Update Question</button>
        </form>
      </div>
    </>
  );
};

export default EditQuestion;
