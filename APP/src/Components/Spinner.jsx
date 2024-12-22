import {MoonLoader} from 'react-spinners';


const Spinner = () => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{height: "100vh"}}>
      <MoonLoader 
      color={"#7652f1"}
      loading={true}
        size={50}
      />
    </div>
  )
}

export default Spinner