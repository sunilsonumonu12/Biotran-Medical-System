import { createContext, useState, useEffect } from "react";
import { doctors as doctorsData } from "../assets/assets";
import axios from "axios";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState(doctorsData);
  const [isDoctor, setIsDoctor] = useState(false); // New flag for doctor role

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
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
  
      const response = await axios.get('http://localhost:4000/api/user/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401 && error.response.data?.isExpired) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        toast.error('Session expired. Please login again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Updated login handler to accept an additional parameter isDoctor
  const handleLogin = (userData, token, isDoctorFlag = false) => {
    setUser(userData);
    setToken(token);
    setIsDoctor(isDoctorFlag);
    localStorage.setItem('jwtToken', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setIsDoctor(false);
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
    isDoctor, // Expose the doctor flag in the context
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
