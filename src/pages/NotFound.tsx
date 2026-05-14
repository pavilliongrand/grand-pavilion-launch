import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">404</h1>
        <p className="mb-4 text-xl text-gray-500">Oops! Page not found</p>
        <Link to="/" className="text-[#84cc16] underline hover:text-[#65a30d]">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
