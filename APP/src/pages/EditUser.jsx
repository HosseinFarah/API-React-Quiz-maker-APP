import React, { useEffect, useState } from "react";
import { set, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../components/Urls";
import { PulseLoader } from "react-spinners";

const EditUser = () => {
  const { register, handleSubmit, setValue } = useForm();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/user/${userId}`, {
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          const userData = data.user; // Adjusted to match the API response structure
          setUser(userData);
          setLoading(false);
          Object.keys(userData).forEach((key) => setValue(key, userData[key]));
        } else {
          toast.error(data.message || "Failed to fetch user data");
        }
      } catch (error) {
        toast.error("An error occurred while fetching user data");
      }
    };
    fetchUser();
  }, [userId, setValue]);

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

  useEffect(() => {
    if (user) {
      Object.keys(user).forEach((key) => setValue(key, user[key]));
    }
    setLoading(false);
  }, [user, setValue]);

  const fetchCsrfToken = async () => {
    const response = await fetch(`${API_URL}/csrf-token`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    return data.csrf_token;
  };

  const onSubmit = async (formData) => {
    try {
      const csrfToken = await fetchCsrfToken();
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "isActive") {
          formDataObj.append(key, value ? "true" : "false");
        } else {
          formDataObj.append(key, value);
        }
      });

      const response = await fetch(`${API_URL}/update_user/${userId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        body: formDataObj,
      });
      const result = await response.json();
      
      if (response.ok) {
        toast.success("User updated successfully");
        setUser(result.user); // Update user state with the updated user data from the response
        Object.keys(result.user).forEach((key) => setValue(key, result.user[key])); // Update form values
        navigate("/all_users");
      } else {
        toast.error(result.message || "Failed to update user");
      }
    } catch (error) {
      toast.error("An error occurred while updating user");
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container" style={{ marginTop: "150px" }}>
      <div className="row justify-content-center">
      {loading && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
              <PulseLoader color="#0d6efd" loading={loading} size={50} />
            </div>
          )}
        <div className="col-md-6">
          <form onSubmit={handleSubmit(onSubmit)} className="container mt-4">
            <div className="mb-3">
              <label className="form-label">First Name</label>
              <input {...register("firstname")} className="form-control" defaultValue={user?.firstname || ''} />
            </div>
            <div className="mb-3">
              <label className="form-label">Last Name</label>
              <input {...register("lastname")} className="form-control" defaultValue={user?.lastname || ''} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input {...register("email")} className="form-control" defaultValue={user?.email || ''} />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input {...register("phone")} className="form-control" defaultValue={user?.phone || ''} />
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <input {...register("address")} className="form-control" defaultValue={user?.address || ''} />
            </div>
            <div>
              <label htmlFor="city" className="form-label">City</label>
              <select {...register("city", { required: true })} className="form-control" defaultValue={user?.city || ''}>
                {cities.map((city) => (
                  <option key={city} value={city} selected={user?.city === city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Zipcode</label>
              <input {...register("zipcode")} className="form-control" defaultValue={user?.zipcode || ''} />
            </div>
            <div className="form-check form-switch mt-2 mb-2">
              <label className="form-check-label" htmlFor="flexSwitchCheckChecked">Is Active</label>
              <input {...register("isActive")} className="form-check-input" id="flexSwitchCheckChecked" type="checkbox" defaultChecked={user?.is_active || false} />
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
                <select {...register("role")} className="form-select" defaultValue={user?.role || ''}>
                    <option value="Administrator">Admin</option>
                    <option value="User">User</option>
                </select>
            </div>


            <button type="submit" className="btn btn-primary">
              Update User
            </button>
            <Link to="/all_users" className="btn btn-secondary ms-2">
                Cancel
            </Link>

          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUser;
