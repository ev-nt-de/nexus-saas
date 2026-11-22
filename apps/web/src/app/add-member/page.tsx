"use client";

import { useState } from "react";
import { apiRequest } from "../lib/api";

export default function AddMemberPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const organizationId = "05626cb1-12b4-46d7-ad74-eaed9c22e515";

    async function addMember(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const result = await apiRequest<{ message: string }>(
                `/api/organizations/${organizationId}/members`,
                {
                    method: "POST",
                    body: JSON.stringify({ email }),
                }
            );

            setMessage(result.message);
            setEmail("");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Unable to add member"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={{ padding: "40px", maxWidth: "500px", margin: "auto" }}>
            <h1>Add Organization Member</h1>

            <form onSubmit={addMember}>
                <input
                    type="email"
                    placeholder="Second account's registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: "12px", width: "100%", marginTop: "20px" }}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: "12px 20px", marginTop: "15px" }}
                >
                    {loading ? "Adding..." : "Add Member"}
                </button>
            </form>

            {message && <p style={{ marginTop: "20px" }}>{message}</p>}
        </main>
    );
}