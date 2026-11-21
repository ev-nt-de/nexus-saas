"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";

interface LoginResponse {
    success: boolean;
    message?: string;
    accessToken: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await apiRequest<LoginResponse>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            localStorage.setItem("nexus_token", data.accessToken);
            localStorage.setItem("nexus_user", JSON.stringify(data.user));

            // router.push("/");
            const orgData = await apiRequest<{
                success: boolean;
                organizations: { id: string; name: string }[];
            }>("/api/organizations");

            if (orgData.organizations.length === 0) {
                router.push("/organization");
            } else {
                router.push("/");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#111827] px-4 py-10 text-[#F9FAFB]">
            <div className="w-full max-w-md">

                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-wider">
                        NEXUS<span className="text-blue-400">.</span>
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Your workspace. Your team's success.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#1F2937] p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold">Welcome back</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Sign in to continue to your workspace.
                    </p>

                    <form onSubmit={handleLogin} className="mt-8 space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-sm font-medium">Password</label>
                                <span className="text-xs text-gray-500">
                                    Forgot password?
                                </span>
                            </div>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 pr-20 text-sm outline-none focus:border-blue-500"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-500 py-3 font-semibold transition hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-gray-400">
                        Don't have an account?{" "}
                        <a href="/register" className="font-semibold text-blue-400">
                            Create account
                        </a>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-gray-500">
                    © 2026 Nexus. All rights reserved.
                </p>
            </div>
        </main>
    );
}