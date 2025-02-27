import { createContext, useState, useEffect } from "react";
import { doctors as doctorsData } from "../assets/assets";

export const AppContext = createContext()

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState(doctorsData);

  useEffect(() => {
    // Check both localStorage and sessionStorage
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, rememberMe = false) => {
    try {
      setUser(userData);
      
      // Remove sensitive or unnecessary data before storage
      const storageData = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        // Add only essential user data
      };
  
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(storageData));
      } else {
        sessionStorage.setItem('user', JSON.stringify(storageData));
      }
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Clear old data if needed
        localStorage.clear();
        try {
          // Try storing again after clearing
          localStorage.setItem('user', JSON.stringify(storageData));
        } catch (e) {
          console.error('Storage still failed after clearing:', e);
        }
      }
      console.error('Storage error:', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  const value = { 
    doctors,
    setDoctors,
    setUser,
    user,
    login,
    logout,
    loading
  };

  return (
    <AppContext.Provider value={value}>
      {!loading && props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;