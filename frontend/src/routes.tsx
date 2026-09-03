import { createBrowserRouter } from "react-router-dom";
import Error from "./pages/error";
import Home from "./pages/home";
import Login from "./pages/login";
import ProtectedRoutes from "./components/protectedRoutes";


export const router = createBrowserRouter([
    {
        element: <ProtectedRoutes />,
        children:[
             {
                path:"/",
                element : <Home />,
                errorElement: <Error />,
             },  
         
        ]
     }, //end of protedted routes

    {
                path:"/login",
                element : <Login />,
                errorElement: <Error />,
    },

]);

export default router;    
       