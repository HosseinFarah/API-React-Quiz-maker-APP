import { useContext } from "react";
import Todos from "./Todos";
import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);
  console.log('isAuthenticated:', isAuthenticated); // Debug log
  

  return (
    <>
      {isAuthenticated && (
        <Link className="btn btn-primary ms-4" style={{marginTop: "150px"}} to="/newtodo">
          <FaPlus /> Add New Todo
        </Link>
      )}
      <Todos isHome={true} />
    </>
  );
};

export default Home;
