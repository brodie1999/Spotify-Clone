// @ts-ignore
import React, { useState } from "react";
import { register} from "../api";
import { useNavigate, Link } from "react-router-dom";

export function Register() {
    const [form, setForm]  = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, [event.target.name]: event.target.value});
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const { access_token } = await register(form);
            localStorage.setItem("token", access_token);
            navigate("/dashboard");
        } catch (error: any) {
            setError(error.message);
        }

    };
    return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
         <h1 className="text-2xl font-semibold text-gray-800 mb-6 text center">
             Create Account
         </h1>
         {error && <p className="text-red-500 mb-2">{error}</p>}
         <form className="space-y-4" onSubmit={handleSubmit}>
           <label className="block mb-2">
             Username
             <input
               name="username"
               value={form.username}
               onChange={handleChange}
               className="w-full border px-2 py-1 rounded"
             />
           </label>
           <label className="block mb-2">
             Email
             <input
               name="email"
               type="email"
               value={form.email}
               onChange={handleChange}
               className="w-full border px-2 py-1 rounded"
             />
           </label>
           <label className="block mb-4">
             Password
             <input
               name="password"
               type="password"
               value={form.password}
               onChange={handleChange}
               className="w-full border px-2 py-1 rounded"
             />
           </label>
           <button
             type="submit"
             className="w-full py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
           >
             Register
           </button>
         </form>
         <p className="mt-4 text-center text-sm">
           Already have an account?{" "}
           <Link to="/" className="text-blue-600 hover:underline">
             Log in
           </Link>
         </p>
        </div>
    );
}
