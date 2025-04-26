import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";

const SignUpPage = () => {
  // Local state to toggle password visibility
  //const [showPassword, setShowPassword] = useState(false);

  // Local state to store form input values
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Access signup function and loading state from auth store
  const { signup, isSigningUp } = useAuthStore();

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData); // Call the signup function with form data
  };

  return (
    <div>
      {/* Page title */}
      <h1>Sign Up</h1>

      {/* Signup form */}
      <form onSubmit={handleSubmit}>
        {/* Name input */}
        <div>
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
        </div>

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

        {/* Password input with toggle button */}
        <div>
          <label>Password</label>
          <input
            type={"text"}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
          {/* Toggle show/hide password
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide" : "Show"}
          </button> */}
        </div>

        {/* Submit button */}
        <button type="submit" disabled={isSigningUp}>
          {isSigningUp ? "Loading..." : "Create Account"}
        </button>
      </form>

      {/* Link to login page */}
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default SignUpPage;
