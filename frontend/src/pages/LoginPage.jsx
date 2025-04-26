import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";

const LoginPage = () => {
  // Local state to toggle password visibility
  //const [showPassword, setShowPassword] = useState(false);

  // Local state to store form input values
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Access login function and loading state from auth store
  const { login, isLoggingIn } = useAuthStore();

    // Handle form submission
    const handleSubmit = async (e) => {
      e.preventDefault();
      login(formData); // Call the login function with form data
    };

    return (
      <div>
        {/* Page title */}
        <h1>Login</h1>
  
        {/* Login form */}
        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div>
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
  
          {/* Password input with show/hide toggle */}
          <div>
            <label>Password</label>
            <input
              type={"text"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            {/* Toggle password visibility
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </button> */}
          </div>
  
          {/* Submit button (disabled if logging in) */}
          <button type="submit" disabled={isLoggingIn}>
            {isLoggingIn ? "Loading..." : "Sign in"}
          </button>
        </form>
  
        {/* Link to signup page */}
        <p>
          Don't have an account? <Link to="/signup">Create account</Link>
        </p>
      </div>
    );
  };
  
  export default LoginPage;
