import { useContext } from "react";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);
  console.log('isAuthenticated:', isAuthenticated); // Debug log
  

  return (
    <>
      {isAuthenticated && (
        <Link className="btn btn-primary ms-4" style={{marginTop: "150px"}} to="/">
          <FaPlus /> Add New 
        </Link>
      )}
      <div className="container" style={{marginTop: "150px"}}>
        <div className="row d-flex justify-content-center">
          <div className="col-md-4">
            <h2>Home</h2>
            <p>Welcome to the home page.</p>
          </div>
        </div>
      </div>

    </>
  );
};

export default Home;
