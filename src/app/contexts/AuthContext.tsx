import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, type AuthResponse } from "../api/auth";
import { usersApi, type UserProfile } from "../api/users";


interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    // Check for stored token and user on mount
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        // Refresh user data to ensure it's up to date
        refreshUser();
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        logout();
      }
    }
    setIsLoading(false);
  }, []);


  const handleAuthSuccess = (response: AuthResponse) => {
    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));
    setUser(response.user as UserProfile);
    setToken(response.token);
  };


  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      handleAuthSuccess(response);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await authApi.signup({ email, password, name });
      handleAuthSuccess(response);
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
  };


  const refreshUser = async () => {
    try {
      const userData = await usersApi.getMe();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // If refresh fails, user might be logged out
      if ((error as any)?.response?.status === 401) {
        logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
