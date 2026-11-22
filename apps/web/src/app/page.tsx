"use client";

import { socket } from "./lib/socket";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/api";

const projects = [
  { name: "Website Redesign", code: "WEB", progress: 75, color: "bg-blue-500" },
  { name: "Mobile Application", code: "APP", progress: 45, color: "bg-violet-500" },
  { name: "Backend API", code: "API", progress: 90, color: "bg-cyan-500" },
];

const tasks = [
  { title: "Build responsive login page", project: "Website Redesign", priority: "Urgent", status: "IN PROGRESS" },
  { title: "Design dashboard layout", project: "Website Redesign", priority: "High", status: "TODO" },
  { title: "Create user authentication API", project: "Backend API", priority: "Medium", status: "IN REVIEW" },
];

export default function Home() {
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected to Nexus real-time server:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Nexus real-time server");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, []);
  const [organizationName, setOrganizationName] = useState("Loading...");
  const [userName, setUserName] = useState("User");
  const [organizationId, setOrganizationId] = useState("");
  console.log("Organization ID:", organizationId);
  useEffect(() => {
    if (!organizationId) return;

    const joinOrganization = () => {
      socket.emit("organization:join", organizationId);
      console.log("Joining organization room:", organizationId);
    };

    if (socket.connected) {
      joinOrganization();
    }

    socket.on("connect", joinOrganization);

    return () => {
      socket.off("connect", joinOrganization);
    };
  }, [organizationId]);
  // const [projects, setProjects] = useState<
  //   { id: string; name: string; description?: string | null }[]
  // >([]);
  const [projects, setProjects] = useState<
    {
      id: string;
      name: string;
      description?: string | null;
    }[]
  >([]);

  const [tasks, setTasks] = useState<
    {
      id: string;
      title: string;
      priority: string;
      status: string;
      project: string;
      projectId: string;
      description?: string | null;
    }[]
  >([]);

  useEffect(() => {
    const handleIssueUpdate = ({
      issue,
    }: {
      issue: {
        id: string;
        title: string;
        priority: string;
        status: string;
        description?: string | null;
      };
    }) => {
      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === issue.id
            ? {
              ...task,
              title: issue.title,
              priority: issue.priority,
              status: issue.status,
              description: issue.description,
            }
            : task
        )
      );
    };

    socket.on("issue:updated", handleIssueUpdate);

    return () => {
      socket.off("issue:updated", handleIssueUpdate);
    };
  }, []);

  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTasks =
    statusFilter === "ALL"
      ? tasks
      : tasks.filter((task) => task.status === statusFilter);

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState("");

  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issuePriority, setIssuePriority] = useState("MEDIUM");
  const [issueError, setIssueError] = useState("");
  const [creatingIssue, setCreatingIssue] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState("");
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editIssueTitle, setEditIssueTitle] = useState("");
  const [editIssueDescription, setEditIssueDescription] = useState("");
  const [editIssuePriority, setEditIssuePriority] = useState("MEDIUM");
  const [editIssueError, setEditIssueError] = useState("");
  const [updatingIssue, setUpdatingIssue] = useState(false);

  useEffect(() => {
    async function loadOrganization() {
      try {
        const orgData = await apiRequest<{
          success: boolean;
          organizations: {
            id: string;
            name: string;
            role: string;
          }[];
        }>("/api/organizations");

        // if (orgData.organizations.length > 0) {
        //   setOrganizationName(orgData.organizations[0].name);
        if (orgData.organizations.length > 0) {
          setOrganizationName(orgData.organizations[0].name);
          setOrganizationId(orgData.organizations[0].id);
        }
        else {
          setOrganizationName("No workspace");
        }

        const storedUser = localStorage.getItem("nexus_user");

        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserName(user.name);
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
        setOrganizationName("Unable to load workspace");
      }
    }

    loadOrganization();
  }, []);

  useEffect(() => {
    if (!organizationId) return;

    async function loadProjectsAndTasks() {
      try {
        // 1. Fetch all projects
        const data = await apiRequest<{
          success: boolean;
          projects: {
            id: string;
            name: string;
            description?: string | null;
          }[];
        }>(`/api/organizations/${organizationId}/projects`);

        setProjects(data.projects);

        // 2. Fetch issues for each project
        const issueResults = await Promise.all(
          data.projects.map(async (project) => {
            const issueData = await apiRequest<{
              success: boolean;
              issues: {
                id: string;
                title: string;
                priority: string;
                status: string;
                description?: string | null;
              }[];
            }>(
              `/api/organizations/${organizationId}/projects/${project.id}/issues`
            );

            return issueData.issues.map((issue) => ({
              id: issue.id,
              title: issue.title,
              priority: issue.priority,
              status: issue.status,
              project: project.name,
              projectId: project.id,
              description: issue.description,
            }));
          })
        );

        // 3. Combine all project issues
        setTasks(issueResults.flat());
      } catch (error) {
        console.error("Projects and tasks loading error:", error);
      }
    }

    loadProjectsAndTasks();
  }, [organizationId]);

  async function handleCreateProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProjectError("");

    if (!organizationId) {
      setProjectError("Organization not found. Please refresh the page.");
      return;
    }

    setCreatingProject(true);

    try {
      await apiRequest("/api/organizations/" + organizationId + "/projects", {
        method: "POST",
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      });

      const data = await apiRequest<{
        success: boolean;
        projects: {
          id: string;
          name: string;
          description?: string | null;
        }[];
      }>("/api/organizations/" + organizationId + "/projects");

      setProjects(data.projects);
      setProjectName("");
      setProjectDescription("");
      setShowProjectForm(false);
    } catch (error) {
      setProjectError(
        error instanceof Error ? error.message : "Unable to create project"
      );
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleCreateIssue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIssueError("");

    if (!selectedProjectId) {
      setIssueError("Please select a project.");
      return;
    }

    setCreatingIssue(true);

    try {
      await apiRequest(
        `/api/organizations/${organizationId}/projects/${selectedProjectId}/issues`,
        {
          method: "POST",
          body: JSON.stringify({
            title: issueTitle,
            description: issueDescription,
            priority: issuePriority,
          }),
        }
      );

      // Refresh Recent Tasks
      const issueData = await apiRequest<{
        success: boolean;
        issues: {
          id: string;
          title: string;
          priority: string;
          status: string;
          description: string | null;
        }[];
      }>(
        `/api/organizations/${organizationId}/projects/${selectedProjectId}/issues`
      );

      const selectedProject = projects.find(
        (project) => project.id === selectedProjectId
      );

      const updatedTasks = issueData.issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        priority: issue.priority,
        status: issue.status,
        project: selectedProject?.name || "Project",
        projectId: selectedProjectId,
        description: issue.description,
      }));

      setTasks((currentTasks) => [
        ...currentTasks.filter(
          (task) => task.project !== selectedProject?.name
        ),
        ...updatedTasks,
      ]);

      setIssueTitle("");
      setIssueDescription("");
      setIssuePriority("MEDIUM");
      setShowIssueForm(false);
    } catch (error) {
      setIssueError(
        error instanceof Error ? error.message : "Unable to create issue"
      );
    } finally {
      setCreatingIssue(false);
    }
  }

  async function handleUpdateIssueStatus(
    taskId: string,
    projectName: string,
    newStatus: string
  ) {
    try {
      const project = projects.find(
        (item) => item.name === projectName
      );

      if (!project) {
        throw new Error("Project not found");
      }

      await apiRequest(
        `/api/organizations/${organizationId}/projects/${project.id}/issues/${taskId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? { ...task, status: newStatus }
            : task
        )
      );
    } catch (error) {
      console.error("Issue status update error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to update issue status"
      );
    }
  }

  async function handleEditIssue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditIssueError("");

    if (!editingIssueId || !editingProjectId) {
      setEditIssueError("Issue or project not found.");
      return;
    }

    setUpdatingIssue(true);

    try {
      await apiRequest(
        `/api/organizations/${organizationId}/projects/${editingProjectId}/issues/${editingIssueId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: editIssueTitle,
            description: editIssueDescription,
            priority: editIssuePriority,
          }),
        }
      );

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingIssueId
            ? {
              ...task,
              title: editIssueTitle,
              description: editIssueDescription,
              priority: editIssuePriority,
            }
            : task
        )
      );

      setShowEditForm(false);
    } catch (error) {
      setEditIssueError(
        error instanceof Error
          ? error.message
          : "Unable to update issue"
      );
    } finally {
      setUpdatingIssue(false);
    }
  }

  async function handleDeleteIssue(
    issueId: string,
    projectId: string
  ) {
    try {
      await apiRequest(
        `/api/organizations/${organizationId}/projects/${projectId}/issues/${issueId}`,
        {
          method: "DELETE",
        }
      );

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== issueId)
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete issue"
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#111827] text-[#F9FAFB]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#1F2937] p-6 md:flex md:flex-col">
          <h1 className="text-2xl font-bold tracking-wide">
            NEXUS<span className="text-blue-400">.</span>
          </h1>
          <p className="mt-1 text-xs text-gray-400">WORKSPACE PLATFORM</p>

          <p className="mb-3 mt-10 text-xs font-semibold text-gray-500">
            WORKSPACE
          </p>

          <nav className="space-y-2">
            <div className="rounded-lg bg-blue-500/15 px-4 py-3 text-blue-400">
              ◈ Dashboard
            </div>
            <div className="rounded-lg px-4 py-3 text-gray-400 hover:bg-white/5">
              ▦ Projects
            </div>
            <div className="rounded-lg px-4 py-3 text-gray-400 hover:bg-white/5">
              ✓ My Tasks
            </div>
            <div className="rounded-lg px-4 py-3 text-gray-400 hover:bg-white/5">
              ◷ Activity
            </div>
          </nav>

          <div className="mt-auto rounded-xl border border-white/10 bg-[#111827] p-4">
            <p className="text-sm font-semibold">Nexus Pro</p>
            <p className="mt-1 text-xs text-gray-400">
              Manage your team's work in one place.
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-gray-700">
              <div className="h-1.5 w-3/4 rounded-full bg-blue-500" />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="min-w-0 flex-1 p-5 md:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              {/* <p className="text-sm text-gray-400">Workspace / Overview</p> */}
              <p className="text-sm text-gray-400">
                {organizationName} / Overview
              </p>
              <h2 className="mt-1 text-2xl font-bold">Dashboard</h2>
              <p className="mt-1 text-sm text-gray-400">
                Welcome back, {userName}! Here's what's happening with your team.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300">
                🔔 Notifications
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Statistics */}
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Projects",
                value: projects.length,
                icon: "▦",
              },
              {
                label: "Total Tasks",
                value: tasks.length,
                icon: "✓",
              },
              {
                label: "In Progress",
                value: tasks.filter(
                  (task) => task.status === "IN_PROGRESS"
                ).length,
                icon: "◷",
              },
              {
                label: "Completed",
                value: tasks.filter(
                  (task) => task.status === "DONE"
                ).length,
                icon: "✦",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-[#1F2937] p-5"
              >
                <p className="text-sm text-gray-400">{item.label}</p>

                <div className="mt-3 flex items-center justify-between">
                  <h3 className="text-3xl font-bold">{item.value}</h3>
                  <span className="text-2xl text-blue-400">
                    {item.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Create Issue Form */}
          {showIssueForm && (
            <form
              onSubmit={handleCreateIssue}
              className="mb-6 rounded-xl border border-white/10 bg-[#1F2937] p-6"
            >
              <h3 className="mb-5 text-lg font-semibold">
                Create New Issue
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="Enter issue title"
                    minLength={2}
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe the issue"
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Priority
                  </label>
                  <select
                    value={issuePriority}
                    onChange={(e) => setIssuePriority(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {issueError && (
                  <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {issueError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creatingIssue}
                    className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                  >
                    {creatingIssue ? "Creating..." : "Create Issue"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowIssueForm(false)}
                    className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Projects */}
          {/* Projects */}
          <div className="mt-9">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Projects</h3>
              <button
                onClick={() => {
                  setShowProjectForm(!showProjectForm);
                  setProjectError("");
                }}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold hover:bg-blue-600"
              >
                + New Project
              </button>
            </div>

            {showProjectForm && (
              <form
                onSubmit={handleCreateProject}
                className="mb-6 rounded-xl border border-white/10 bg-[#1F2937] p-6"
              >
                <h4 className="mb-5 text-lg font-semibold">Create New Project</h4>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name"
                      minLength={2}
                      required
                      className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Description
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Describe your project (optional)"
                      rows={3}
                      className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  {projectError && (
                    <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                      {projectError}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={creatingProject}
                      className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                    >
                      {creatingProject ? "Creating..." : "Create Project"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowProjectForm(false)}
                      className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {projects.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#1F2937] p-8 text-center">
                <h4 className="font-semibold">No projects yet</h4>
                <p className="mt-2 text-sm text-gray-400">
                  Create your first project to get started.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-white/10 bg-[#1F2937] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-xs text-gray-500">PROJECT</span>
                    </div>

                    <h4 className="mt-4 font-semibold">{project.name}</h4>

                    <p className="mt-2 text-sm text-gray-400">
                      {project.description || "No description provided."}
                    </p>

                    <button
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setShowIssueForm(true);
                        setIssueError("");
                      }}
                      className="mt-5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold hover:bg-blue-600"
                    >
                      + Create Issue
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Issue Form */}
          {showEditForm && (
            <form
              onSubmit={handleEditIssue}
              className="mb-6 rounded-xl border border-white/10 bg-[#1F2937] p-6"
            >
              <h3 className="mb-5 text-lg font-semibold">
                Edit Issue
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    value={editIssueTitle}
                    onChange={(e) => setEditIssueTitle(e.target.value)}
                    minLength={2}
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    value={editIssueDescription}
                    onChange={(e) => setEditIssueDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Priority
                  </label>
                  <select
                    value={editIssuePriority}
                    onChange={(e) => setEditIssuePriority(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {editIssueError && (
                  <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {editIssueError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={updatingIssue}
                    className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                  >
                    {updatingIssue ? "Updating..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Recent tasks */}
          <div className="mt-9 rounded-xl border border-white/10 bg-[#1F2937] p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Recent Tasks</h3>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500"
              >
                <option value="ALL">All Issues</option>
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {filteredTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                {tasks.length === 0
                  ? "No tasks yet. Create an issue to get started."
                  : "No issues found for this status."}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {task.project}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="rounded-full bg-violet-500/15 px-3 py-1 text-violet-300">
                        {task.priority}
                      </span>

                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleUpdateIssueStatus(
                            task.id,
                            task.project,
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs text-gray-300 outline-none focus:border-blue-500"
                      >

                        <option value="BACKLOG">Backlog</option>
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIssueId(task.id);
                          setEditingProjectId(task.projectId);
                          setEditIssueTitle(task.title);
                          setEditIssueDescription(task.description || "");
                          setEditIssuePriority(task.priority);
                          setEditIssueError("");
                          setShowEditForm(true);
                        }}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-blue-400 hover:bg-white/5"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Are you sure you want to delete this issue?"
                          );

                          if (confirmed) {
                            handleDeleteIssue(task.id, task.projectId);
                          }
                        }}
                        className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <footer className="mt-8 text-center text-xs text-gray-500">
            © 2026 Nexus. Built for better teamwork.
          </footer>
        </section>
      </div >
    </main >
  );
}