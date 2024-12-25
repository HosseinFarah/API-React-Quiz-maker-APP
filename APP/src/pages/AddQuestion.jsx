import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { API_URL } from "../components/Urls";
import { useNavigate, useParams } from "react-router-dom";
import { getCsrfToken } from "../utils/csrfUtils";

const AddQuestion = () => {
  const { quizId } = useParams(); // Get quizId from URL parameters
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      text: "",
      format: "multiple_choice",
      score: "",
      options_format: "A,B,C,D", // Default value for options_format
      answers: [
        {
          text: "",
          image: null,
          is_correct: false,
          order_number: "",
          score: "",
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      const token = await getCsrfToken();
      setCsrfToken(token);
    };
    fetchCsrfToken();
  }, []);

  const format = watch("format");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("text", data.text);
      formData.append("format", data.format);
      formData.append("score", data.score || "0"); // Ensure score is not empty
      formData.append("options_format", data.options_format); // Include options_format
      formData.append("quiz_id", quizId);

      data.answers.forEach((answer, index) => {
        formData.append(`answers[${index}][text]`, answer.text || ""); // Ensure text is not empty
        formData.append(`answers[${index}][is_correct]`, answer.is_correct);
        formData.append(`answers[${index}][order_number]`, answer.order_number || ""); // Ensure order_number is not empty
        formData.append(`answers[${index}][score]`, answer.score || "0"); // Ensure score is not empty
        if (answer.image) {
          formData.append(`answers[${index}][image]`, answer.image[0]);
        }
      });

      console.log("Submitting form data:", Object.fromEntries(formData.entries()));

      const response = await fetch(
        `${API_URL}/quiz/${quizId}/create_question`,
        {
          method: "POST",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          body: formData,
          credentials: "include",
        }
      );

      const result = await response.json();
      if (response.ok) {
        toast.success("Question added successfully");
        navigate(`/quiz/${quizId}`);
      } else {
        console.error("Failed to add question:", result);
        toast.error(result.message || "Failed to add question");
        if (result.errors) {
          Object.keys(result.errors).forEach((key) => {
            toast.error(`${key}: ${result.errors[key].join(", ")}`);
          });
        }
      }
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: "150px" }}>
      <div className="row d-flex justify-content-center">
        <div className="col-md-6">
          <form onSubmit={handleSubmit(onSubmit)} className="form">
            <div className="form-group">
              <label>Question Text</label>
              <Controller
                name="text"
                control={control}
                rules={{ required: "Question text is required" }}
                render={({ field }) => (
                  <textarea {...field} className="form-control" />
                )}
              />
              {errors.text && (
                <p className="text-danger">{errors.text.message}</p>
              )}
            </div>

            <div className="form-group">
              <label>Format</label>
              <Controller
                name="format"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-control">
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                  </select>
                )}
              />
            </div>


            <div className="form-group">
              <label>Options Format</label>
              <Controller
                name="options_format"
                control={control}
                rules={{ required: "Options format is required" }}
                render={({ field }) => (
                  <select {...field} className="form-control">
                    <option value="A,B,C,D">A,B,C,D</option>
                    <option value="1,2,3,4">1,2,3,4</option>
                  </select>
                )}
              />
              {errors.options_format && (
                <p className="text-danger">{errors.options_format.message}</p>
              )}
            </div>

            {format === "multiple_choice" && (
              <div className="form-group">
                <label>Answers</label>
                {fields.map((field, index) => (
                  <div key={field.id} className="form-group">
                    <Controller
                      name={`answers[${index}].text`}
                      control={control}
                      rules={{ required: "Answer text is required" }}
                      render={({ field }) => (
                        <input
                          {...field}
                          placeholder={`Answer ${index + 1}`}
                          className="form-control"
                          value={field.value ?? ""}
                        />
                      )}
                    />
                    <Controller
                      name={`answers[${index}].image`}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="file"
                          {...field}
                          className="form-control"
                        />
                      )}
                    />
                    <Controller
                      name={`answers[${index}].is_correct`}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          {...field}
                          onChange={(e) => {
                            setValue(
                              `answers[${index}].is_correct`,
                              e.target.checked
                            );
                          }}
                          className="form-check-input"
                        />
                      )}
                    />
                    <Controller
                      name={`answers[${index}].score`}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          {...field}
                          placeholder="Score"
                          className="form-control"
                          value={field.value ?? ""}
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    append({
                      text: "",
                      image: null,
                      is_correct: false,
                      order_number: "",
                      score: "",
                    })
                  }
                  className="btn btn-primary"
                >
                  Add Answer
                </button>
              </div>
            )}

            {format === "true_false" && (
              <div className="form-group">
                <label>Answers</label>
                <div className="form-check">
                  <Controller
                    name="answers[0].text"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        value="True"
                        readOnly
                        className="form-control-plaintext"
                      />
                    )}
                  />
                  <Controller
                    name="answers[0].is_correct"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="radio"
                        {...field}
                        onChange={() => {
                          setValue("answers[0].is_correct", true);
                          setValue("answers[1].is_correct", false);
                        }}
                        className="form-check-input"
                      />
                    )}
                  />
                </div>
                <div className="form-check">
                  <Controller
                    name="answers[1].text"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        value="False"
                        readOnly
                        className="form-control-plaintext"
                      />
                    )}
                  />
                  <Controller
                    name="answers[1].is_correct"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="radio"
                        {...field}
                        onChange={() => {
                          setValue("answers[0].is_correct", false);
                          setValue("answers[1].is_correct", true);
                        }}
                        className="form-check-input"
                      />
                    )}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddQuestion;
