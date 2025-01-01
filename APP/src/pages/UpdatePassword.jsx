import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../Components/Urls";
import {useForm} from "react-hook-form";
import { toast } from "react-toastify";
import {MoonLoader} from "react-spinners";
import { getCsrfToken } from "../Utils/csrfUtils";

const UpdatePassword = () => {
    const navigate = useNavigate(); // Move useNavigate to the top level
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");
    const { register, handleSubmit, setError, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const userId = user?.id;    

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`${API_URL}/user-info`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'credentials': 'include' // Add credentials to include cookies
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }

                const data = await response.json();
                console.log('Response data:', data); // Log the entire data object
                setUser(data); // Set user to data instead of data.user
                console.log('User data:', data);
            } catch (error) {
                console.error('Error fetching user:', error);
                setError(error.message);
            } finally {
                setLoading(false); // Set loading to false after fetching
            }
        };

        fetchUser();
    }, []);

    if (!user) {
        return <div>Loading...</div>;
    }

    const getCsrfToken = async () => {
        const response = await fetch(`${API_URL}/csrf-token`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        return data.csrf_token;
    };

    const onSubmit = async (data) => {
        console.log(data);
        setLoading(true);
        setErr("");
        setSuccess("");
        try {
            const csrfToken = await getCsrfToken(); // Fetch CSRF token
            const response = await fetch(`${API_URL}/update_password/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'credentials': 'include'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }

            const result = await response.json();
            setSuccess(result.message);
            toast.success(result.message);
            navigate("/login");
        }
        catch (error) {
            console.error('Error updating password:', error);
            setErr(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }


    

    return (
        <div className="container" style={{marginTop: "150px"}}>
            <div className="row d-flex justify-content-center">
                {loading && <div className="text-center mt-5"><MoonLoader color="#36D7B7" size={50} /></div>}

                {!loading && (
                    <div className="col-md-5 mt-5">
                        <h1 className="text-center">Update Password</h1>
                        {err && <div className="alert alert-danger">{err}</div>}
                        {success && <div className="alert alert-success">{success}</div>}
                        <form onSubmit={handleSubmit(onSubmit)} className="form">
                            <div className="form-group">
                                <label htmlFor="current_password">Current Password</label>
                                <input type="password" id="current_password" className="form-control" {...register("current_password", { required: "Current password is required" })} value={password} onChange={(e) => setPassword(e.target.value)} />
                                {errors.current_password && <small className="text-danger">{errors.current_password.message}</small>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="new_password">New Password</label>
                                <input type="password" id="new_password" className="form-control" {...register("new_password", { required: "New password is required" })} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                {errors.new_password && <small className="text-danger">{errors.new_password.message}</small>}

                            </div>

                            <div className="form-group">
                                <label htmlFor="confirm_password">Confirm Password</label>
                                <input type="password" id="confirm_password" className="form-control" {...register("confirm_password", { 
                                    required: "Confirm password is required",
                                    validate: value => value === newPassword || "Passwords do not match"
                                })} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                {errors.confirm_password && <small className="text-danger">{errors.confirm_password.message}</small>}
                            </div>

                            <button type="submit" className="btn btn-primary">Update Password</button>

                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}


export default UpdatePassword;



