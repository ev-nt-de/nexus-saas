"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password }),
            });

            setSuccess("Account created successfully! Redirecting to login...");
            setTimeout(() => router.push("/login"), 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
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
                        Build better things together.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#1F2937] p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold">Create your account</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Get started with your Nexus workspace.
                    </p>

                    <form onSubmit={handleRegister} className="mt-8 space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                required
                                minLength={2}
                                className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Email Address
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
                            <label className="mb-2 block text-sm font-medium">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 8 characters"
                                    required
                                    minLength={8}
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

                        {success && (
                            <p className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
                                {success}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-500 py-3 font-semibold transition hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-gray-400">
                        Already have an account?{" "}
                        <a href="/login" className="font-semibold text-blue-400">
                            Sign in
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