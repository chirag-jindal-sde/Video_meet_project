import { createContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

const client = axios.create({
  baseURL: "http://localhost:8080/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (name, username, password) => {
    const res = await client.post("/register", {
      name,
      username,
      password,
    });

    if (res.status === 201) {
      return res.data.message;
    }
  };

  const handleLogin = async (username, password) => {
    const res = await client.post("/login", {
      username,
      password,
    });

    if (res.status === 200) {
      localStorage.setItem("token", res.data.token);
      setUserData(res.data.user);
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{ userData, setUserData, handleRegister, handleLogin }}
    >
        {children}
    </AuthContext.Provider>
  )
};
