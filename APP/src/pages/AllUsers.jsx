import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { API_URL, IMAGE_URL_USER } from "../Components/Urls";
import { getCsrfToken } from "../utils/csrfUtils";
import { toast } from "react-toastify";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit } = useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 15;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const csrfToken = await getCsrfToken(); // Fetch CSRF token
        const response = await fetch(`${API_URL}/all_users`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken, // Use fetched CSRF token
          },
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message);
        }
        setUsers(data.users);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to fetch users");
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (user_id) => {
    const csrfToken = await getCsrfToken(); // Fetch CSRF token
    if (!csrfToken) {
      toast.error("CSRF token is missing");
      return;
    }

    if (window.confirm(`Are you sure you want to delete user with id ${user_id}?`)) {
      try {
        const response = await fetch(`${API_URL}/delete_user/${user_id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken, // Use fetched CSRF token
          },
          credentials: "include",
        });
        const data = await response.json();
        console.log("Data from delete user:", data);
        
        if (!response.ok) {
          throw new Error(data.message);
        }
        setUsers(users.filter((user) => user.id !== user_id));
        toast.success(data.message);
      } catch (error) {
        console.error("Failed to delete user:", error);
        toast.error("Failed to delete user");
      }
    }
  };

  
  const onSubmit = async (data) => {
    try {
      const csrfToken = await getCsrfToken(); // Fetch CSRF token
      const response = await fetch(`${API_URL}/search_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken, // Use fetched CSRF token
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message);
      }
      setUsers(res.users);
    } catch (error) {
      console.error("Failed to search user:", error);
      toast.error("Failed to search user");
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '▲' : '▼';
    }
    return '↕';
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div className="container" style={{ marginTop: "150px" }}>
      <div className="row justify-content-center">
        <div className="col-md-12">
          <h1>All Users</h1>
          <table className="table table-bordered table-striped table-hover">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>Id {getSortIcon('id')}</th>
                <th onClick={() => handleSort('firstname')}>Fullname {getSortIcon('firstname')}</th>
                <th onClick={() => handleSort('email')}>Email {getSortIcon('email')}</th>
                <th onClick={() => handleSort('role')}>Role {getSortIcon('role')}</th>
                <th onClick={() => handleSort('city')}>City {getSortIcon('city')}</th>
                <th onClick={() => handleSort('phone')}>Phone {getSortIcon('phone')}</th>
                <th>Image</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">Loading...</td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="8">No users found</td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.firstname + " " + user.lastname}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.city}</td>
                    <td>{user.phone}</td>
                    <td>
                        {user.image ? (
                      <img
                        src={IMAGE_URL_USER + user.image}
                        alt={user.firstname}
                        width="50"
                        height="50"
                        className="img-thumbnail"
                      />
                    ) : (
                        <img
                            src={IMAGE_URL_USER + "default.jpg"}
                            alt={user.firstname}
                            width="50"
                            height="50"
                            className="img-thumbnail"
                        />
                        )}
                        
                    </td>
                    <td>
                      {user.role !== "Administrator" && (
                        <>
                          <Link
                            to={`/edit_user/${user.id}`}
                            className="btn btn-primary me-2"
                          >
                            <i className="fa fa-edit"></i>
                          </Link>

                          <button
                            onClick={() => handleDelete(user.id)}
                            className="btn btn-danger"
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* pagination */}
          <nav aria-label="Page navigation">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
              </li>
              {[...Array(totalPages)].map((_, index) => (
                <li key={index} className={`page-item ${currentPage === index + 1 ? "active" : ""}`}>
                  <button className="page-link" onClick={() => handlePageChange(index + 1)}>{index + 1}</button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Next</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AllUsers;
