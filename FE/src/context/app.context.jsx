import { createContext, useContext, useEffect, useState } from "react";

const initialAppContext = {
  isAuthenticated: false,
  setIsAuthenticated: () => {
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null;
  },
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  setUser: () => {},
  reset: () => {},
};

export const AppContext = createContext(initialAppContext);

export const useAuth = () => useContext(AppContext);

// Provider
export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("user");
  });

  const [user, setUser] = useState(() => {
    const userInfo = localStorage.getItem("user");
    return userInfo ? JSON.parse(userInfo) : null;
  });
  const role = user?.role ?? "user";

  const isAdmin = role === "admin";
  const isEmployee = role === "employee";
  const isUser = role === "user";

  useEffect(() => {
    const userInfo = localStorage.getItem("user");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      setUser(parsed);
      setIsAuthenticated(true);
    }
  }, []);
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("user");
      setIsAuthenticated(false);
    }
  }, [user]);

  const reset = () => {
    setUser(null);
    localStorage.removeItem("user");
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        reset,
        role,
        isAdmin,
        isEmployee,
        isUser,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
