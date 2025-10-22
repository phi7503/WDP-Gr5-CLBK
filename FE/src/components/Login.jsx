import React, { useState } from "react";
import test5 from "../assets/login.jpg";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { loginSchema } from "../lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Input from "./ui/Input";
import { cn } from "../lib/utils";
import { useAuth } from "../context/app.context";
import api from "./services/api";

export default function Login() {
  const { setUser, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [error, setError] = useState();
  const [showPassword, setShowPassword] = useState();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await api.post("/users/login", {
        email: data.email,
        password: data.password,
      });

      if (response.data.success) {
        const { user, token } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        
        // Redirect based on role
        if (user.role === "admin" || user.role === "employee") {
          navigate("/employee/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className=" overflow-y-auto p-10 min-h-screen md:w-1/2 flex  items-center justify-center px-4">
      <div className="flex w-full  min-h-[32rem] max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10  p-10 md:w-1/2 h-full flex flex-col justify-center my-auto">
          <div className=" text-center space-y-10  h-full">
            <h1 className="text-3xl text-blue-500 font-bold">Login to CLBK</h1>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              {error && <p className="text-center text-destructive">{error}</p>}
              <div>
                <Input 
                  placeholder="Email" 
                  {...form.register("email")}
                  type="email"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className={"pe-10"}
                    placeholder="Password"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
            <div className="space-y-5">
              <Link
                to="/register"
                className="block text-center hover:underline text-blue-500 "
              >
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </div>
        </div>
        <img
          src={test5}
          alt=""
          className="hidden w-1/2 object-cover md:block h-full "
        ></img>
      </div>
    </div>
  );
}
