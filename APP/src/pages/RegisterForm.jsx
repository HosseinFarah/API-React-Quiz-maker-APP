import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../components/Urls";
import { fetchCsrfToken, getCsrfToken } from "../utils/csrfUtils";

const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_URL}/cities`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  const onSubmit = async (data) => {
    try {
      await fetchCsrfToken();
      const csrfToken = await getCsrfToken();

      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(
          "Registration successful. A confirmation email has been sent."
        );
        navigate("/login");
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div style={{ marginTop: "150px" }} className="container">
      <div className="row d-flex justify-content-center">
        <div className="col-md-6 shadow rounded p-4 mb-5">
          <h2 className="text-secondary mt-1">Register</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="form-group">
            <div>
              <label htmlFor="firstname" className="form-label">
                First Name
              </label>
              <input
                {...register("firstname", { required: true })}
                className="form-control"
              />
              {errors.firstname && (
                <span className="text-danger">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="lastname" className="form-label">
                Last Name
              </label>
              <input
                {...register("lastname", { required: true })}
                className="form-control"
              />
              {errors.lastname && (
                <span className="text-danger">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                {...register("email", { required: true })}
                className="form-control"
              />
              {errors.email && (
                <span className="text-danger">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                {...register("password", { required: true })}
                className="form-control"
              />
              {errors.password && (
                <span className="text-danger">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="address" className="form-label">
                Address
              </label>
              <input
                {...register("address", { required: true })}
                className="form-control"
              />
              {errors.address && (
                <span className="text-danger">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="zipcode" className="form-label">
                Zip Code
              </label>
              <input
                {...register("zipcode", { required: true })}
                className="form-control"
              />
              {errors.zipcode && (
                <span className="text-danger">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="form-label">
                Phone
              </label>
              <input
                {...register("phone", { required: true })}
                className="form-control"
              />
              {errors.phone && (
                <span className="text-danger">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="city" className="form-label">
                City
              </label>
              <select
                {...register("city", { required: true })}
                className="form-control"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && (
                <span className="text-danger">This field is required</span>
              )}
            </div>
            <div>
              <label htmlFor="image" className="form-label">
                Profile Picture
              </label>
              <input
                type="file"
                {...register("image")}
                className="form-control"
              />
            </div>
            <div className="ms-auto d-flex justify-content-end mt-3">
              <button type="submit" className="btn btn-info mt-2 ">
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
