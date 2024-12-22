import { toast } from "react-toastify";
import { Container,Row } from "react-bootstrap";
import axios from "axios";
import { useEffect, useState } from "react";
import Spinner from "../Components/Spinner";
import { FaEdit,FaTrashAlt } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import HandleTodo from "../Components/HandleTodo";
import {JSON_URL} from "../Components/Urls";
import {useAuth} from "../context/AuthContext";

const Todos = ({isHome=false}) => {
  const {isAdmin} = useAuth();
  const [todoList, setTodoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const location = useLocation();

  const todoListHandler = isHome ? todoList.slice(0,3): todoList;

  const fetchTodoList = async () => {
    try {
      const response = await axios.get(`${JSON_URL}/todos`);
      setTodoList(response.data);
      toast.success("Todo List fetched successfully");
      setLoading(false);
    } catch (error) {
      toast.error("Something went wrong", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodoList();
  }, []);

  const editTodoHandler = (todo) => {
    setSelectedTodo(todo);

  }

  const deleteTodoHandler = async (id) => {
    if (!window.confirm("Are you sure you want to delete this todo?")) {
      return;
    }
    try {
      await axios.delete(`${JSON_URL}/todos/${id}`);
      const response = await axios.get(`${JSON_URL}/todos`);
      setTodoList(response.data);
      toast.error("Todo deleted successfully");
    }
    catch (error) {
      toast.error("Something went wrong", error.message);
    }
  }



  return (
    <Container className="fluid" style={{ marginTop: "90px" }}>
      <Row className="justify-content-left">
        <h1 className="text-center mt-5">Todo List</h1>
        {loading && <Spinner />}
        {todoListHandler &&
          todoListHandler.map((todo) => (
            <div className="col-sm-12 col-md-6 col-lg-4 col-xl-4" key={todo.id}>
              <div className="card mt-5">
                <div className={`card-header ${todo.status === 'completed' ? 'bg-success' : todo.status === 'in-progress' ? 'bg-warning' : 'bg-danger'}`}>
                  <h3>{todo.title ? todo.title : "No Title"}</h3>
                </div>
                <div className="card-body">
                  <p>{todo.date ? todo.date : "No Date"}</p>
                  <p>{todo.status ? todo.status : "No Status"}</p>
                </div>
                <div className="card-footer">
                  { isAdmin ? <>
                  <FaEdit className="text-success ms-2 float-end" onClick={() => editTodoHandler(todo)} />
                  <FaTrashAlt className="text-danger float-end ms-3" onClick={() => deleteTodoHandler(todo.id)} />
                    </> : null}

                  </div>
              </div>
            </div>
          ))}
      </Row>
      {location.pathname === "/todos" ? <HandleTodo todo={selectedTodo} fetchTodoList={fetchTodoList} setSelectedTodo={setSelectedTodo} /> : null}
    </Container>
  );
};


export default Todos;
