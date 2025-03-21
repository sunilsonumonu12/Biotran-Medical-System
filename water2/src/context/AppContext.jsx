import { createContext, useState, useEffect } from "react";
import { doctors as doctorsData } from "../assets/assets";
import axios from "axios";

export const AppContext = createContext()

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState(doctorsData);

  // Check for token and user data on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user data using stored token
  const fetchUserData = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/user/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If token is invalid, logout
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userData, token) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('jwtToken', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('jwtToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Add axios interceptor for handling token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const value = { 
    doctors,
    setDoctors,
    user,
    setUser,
    token,
    login: handleLogin,
    logout: handleLogout,
    loading
  };

  return (
    <AppContext.Provider value={value}>
      {!loading && props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;