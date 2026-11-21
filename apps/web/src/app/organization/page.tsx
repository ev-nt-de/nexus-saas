"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";

interface OrganizationResponse {
    success: boolean;
    message: string;
    organization: {
        id: string;
        name: string;
        slug: string;
    };
}

export default function OrganizationPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await apiRequest<OrganizationResponse>("/api/organizations", {
                method: "POST",
                body: JSON.stringify({ name }),
            });

            router.push("/");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to create organization"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#111827] px-4 text-[#F9FAFB]">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1F2937] p-8 shadow-2xl">
                <h1 className="text-3xl font-bold">
                    NEXUS<span className="text-blue-400">.</span>
                </h1>

                <p className="mt-8 text-sm font-semibold text-blue-400">
                    LET'S GET STARTED
                </p>

                <h2 className="mt-3 text-2xl font-bold">
                    Create your workspace
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                    Set up an organization where you and your team can manage projects,
                    tasks, and collaboration.
                </p>

                <form onSubmit={handleCreate} className="mt-8 space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Organization name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Nexus Technologies"
                            minLength={2}
                            required
                            className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                        />
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
                        {loading ? "Creating workspace..." : "Create Workspace"}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-500">
                    You will become the administrator of this organization.
                </p>
            </div>
        </main>
    );
}