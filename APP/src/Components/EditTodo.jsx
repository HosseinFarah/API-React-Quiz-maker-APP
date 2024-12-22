import { Container } from "react-bootstrap";
import {useForm} from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {JSON_URL} from "../Components/Urls";

const EditTodo = ({ todo, fetchTodoList }) => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const navigate = useNavigate();

  useEffect(() => {
    if (todo) {
      setValue("title", todo.title);
      setValue("date", todo.date);
      setValue("status", todo.status);
    }
  }, [todo, setValue]);

  const onSubmit = async (data) => {
    try {
      if (todo) {
        await axios.put(`${JSON_URL}/todos/${todo.id}`, {
          title: data.title,
          date: data.date,
          status: data.status,
        });
        toast.success("Todo updated successfully");
      } else {
        await axios.post(`${JSON_URL}/todos`, {
          title: data.title,
          date: data.date,
          status: data.status,
        });
        toast.success("Todo added successfully");
      }
      setValue("title", "");
      setValue("date", "");
      setValue("status", "");
      fetchTodoList();
      navigate("/todos");
    } catch (error) {
      console.log(error);
    }
  }

  return (
  <>
  <Container style={{ marginTop: "150px" }}>
    <div className="row">
      <div className="col-md-6">
    <h1>{todo ? "Edit Todo" : "Add Todo"}</h1>
    <form onSubmit={handleSubmit(onSubmit)} >
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input type="text" className="form-control" id="title" name="title" 
        {...register("title", { 
          required: true, 
          pattern: /^[a-zA-ZäöåÄÖÅ]+$/ 
        })}
        />
        {errors.title && errors.title.type === "pattern" && <span className="text-danger">Only alphabets are allowed | </span>}
        {errors.title && <span className="text-danger">This field is required</span>}
      </div>
      <div className="form-group">
        <label htmlFor="date">Date</label>
        <input type="date" className="form-control" id="date" name="date" {...register("date",{required:true})} required />
        {errors.date && <span className="text-danger">This field is required</span>}
      </div>
      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select className="form-control" id="status" name="status" {...register("status",{required:true})} required>
          <option value="" selected disabled>Select Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        {errors.status && <span className="text-danger">This field is required</span>}
      </div>
      <button type="submit" className="btn btn-primary mt-3 float-end">{todo ? "Update Todo" : "Add Todo"}</button>
    </form>
    </div>
    </div>
  </Container>
  </>
  );
};


export default EditTodo;
