import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Task } from "gantt-task-react";

interface GanttTask {
  id: string;
  title: string;
  project_id: string;
  start_date?: string;
  due_date?: string;
  progress?: number;
  status?: string;
  priority?: string;
  assigned_to?: string;
  is_on_critical_path?: boolean;
}

interface TaskDependency {
  id: string;
  task_id: string; // The task that depends on something
  depends_on_task_id: string; // The task it depends on
  dependency_type: string;
}

export const useGanttTasks = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!projectId || projectId === "all") {
      await fetchAllProjectsTasks();
      return;
    }

    try {
      setLoading(true);

      // Fetch tasks for the project
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch task dependencies
      const taskIds = tasksData?.map((t) => t.id) || [];
      const { data: depsData, error: depsError } = await supabase
        .from("task_dependencies")
        .select("*")
        .in("task_id", taskIds);

      if (depsError) throw depsError;

      setDependencies(depsData || []);

      // Convert to Gantt format
      const ganttTasks = convertToGanttFormat(tasksData || [], depsData || []);
      setTasks(ganttTasks);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjectsTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all projects for the user
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id);

      if (projectsError) throw projectsError;

      const projectIds = projects?.map((p) => p.id) || [];

      // Fetch all tasks for these projects
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .in("project_id", projectIds)
        .order("start_date", { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch dependencies
      const taskIds = tasksData?.map((t) => t.id) || [];
      const { data: depsData, error: depsError } = await supabase
        .from("task_dependencies")
        .select("*")
        .in("task_id", taskIds);

      if (depsError) throw depsError;

      setDependencies(depsData || []);

      // Convert to Gantt format with project grouping
      const ganttTasks = convertToGanttFormat(tasksData || [], depsData || [], projects || []);
      setTasks(ganttTasks);
    } catch (error: any) {
      console.error("Error fetching all tasks:", error);
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertToGanttFormat = (
    dbTasks: GanttTask[],
    dbDeps: TaskDependency[],
    projects?: any[]
  ): Task[] => {
    const ganttTasks: Task[] = [];
    const today = new Date();

    // Group tasks by project if multiple projects
    if (projects && projects.length > 0) {
      projects.forEach((project) => {
        const projectTasks = dbTasks.filter((t) => t.project_id === project.id);
        
        if (projectTasks.length === 0) return;

        // Add project as a parent task
        const projectStart = projectTasks.reduce((earliest, task) => {
          const taskStart = task.start_date ? new Date(task.start_date) : today;
          return taskStart < earliest ? taskStart : earliest;
        }, new Date(projectTasks[0]?.start_date || today));

        const projectEnd = projectTasks.reduce((latest, task) => {
          const taskEnd = task.due_date ? new Date(task.due_date) : today;
          return taskEnd > latest ? taskEnd : latest;
        }, new Date(projectTasks[0]?.due_date || today));

        ganttTasks.push({
          start: projectStart,
          end: projectEnd,
          name: project.name,
          id: `project-${project.id}`,
          type: "project",
          progress: calculateProjectProgress(projectTasks),
          isDisabled: true,
          hideChildren: false,
          styles: {
            progressColor: "#8b5cf6",
            progressSelectedColor: "#7c3aed",
            backgroundColor: "#ede9fe",
            backgroundSelectedColor: "#ddd6fe",
          },
        });

        // Add tasks for this project
        projectTasks.forEach((task) => {
          ganttTasks.push(convertTaskToGantt(task, dbDeps, `project-${project.id}`));
        });
      });
    } else {
      // Single project - just add tasks
      dbTasks.forEach((task) => {
        ganttTasks.push(convertTaskToGantt(task, dbDeps));
      });
    }

    return ganttTasks;
  };

  const convertTaskToGantt = (
    task: GanttTask,
    dbDeps: TaskDependency[],
    projectId?: string
  ): Task => {
    const today = new Date();
    const start = task.start_date ? new Date(task.start_date) : today;
    const end = task.due_date ? new Date(task.due_date) : new Date(today.getTime() + 86400000);

    // Find dependencies for this task (tasks that this task depends on)
    const taskDeps = dbDeps
      .filter((dep) => dep.task_id === task.id)
      .map((dep) => dep.depends_on_task_id);

    const isCritical = task.is_on_critical_path || false;

    return {
      start,
      end,
      name: task.title || "Untitled Task",
      id: task.id,
      type: "task",
      progress: task.progress || 0,
      isDisabled: false,
      dependencies: taskDeps,
      project: projectId,
      styles: isCritical
        ? {
            progressColor: "#ef4444",
            progressSelectedColor: "#dc2626",
            backgroundColor: "#fef2f2",
            backgroundSelectedColor: "#fee2e2",
          }
        : {
            progressColor: "#3b82f6",
            progressSelectedColor: "#2563eb",
            backgroundColor: "#dbeafe",
            backgroundSelectedColor: "#bfdbfe",
          },
    };
  };

  const calculateProjectProgress = (tasks: GanttTask[]): number => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / tasks.length);
  };

  const updateTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          start_date: task.start.toISOString().split("T")[0],
          due_date: task.end.toISOString().split("T")[0],
          progress: task.progress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? task : t))
      );

      toast({
        title: "Task updated",
        description: `"${task.name}" has been updated successfully.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTaskProgress = async (task: Task) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          progress: task.progress,
          status: task.progress === 100 ? "completed" : task.progress > 0 ? "in_progress" : "todo",
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;

      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? task : t))
      );

      toast({
        title: "Progress updated",
        description: `"${task.name}" is now ${task.progress}% complete.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Error updating progress",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const createTask = async (taskData: {
    title: string;
    start_date: string;
    due_date: string;
    description?: string;
    priority?: string;
    status?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title: taskData.title,
          description: taskData.description || null,
          start_date: taskData.start_date,
          due_date: taskData.due_date,
          priority: taskData.priority || "medium",
          status: taskData.status || "todo",
          progress: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Task created",
        description: `"${taskData.title}" has been created successfully.`,
      });

      // Refetch to update the UI
      await fetchTasks();

      return { success: true, data };
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, data: null };
    }
  };

  const createDependency = async (taskId: string, dependsOnTaskId: string, type: string = "finish_to_start") => {
    try {
      const { error } = await supabase
        .from("task_dependencies")
        .insert({
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
          dependency_type: type,
        });

      if (error) throw error;

      // Refetch to update dependencies
      await fetchTasks();

      toast({
        title: "Dependency created",
        description: "Task dependency has been created successfully.",
      });

      return true;
    } catch (error: any) {
      console.error("Error creating dependency:", error);
      toast({
        title: "Error creating dependency",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteDependency = async (dependencyId: string) => {
    try {
      const { error } = await supabase
        .from("task_dependencies")
        .delete()
        .eq("id", dependencyId);

      if (error) throw error;

      // Refetch to update dependencies
      await fetchTasks();

      toast({
        title: "Dependency removed",
        description: "Task dependency has been removed successfully.",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting dependency:", error);
      toast({
        title: "Error deleting dependency",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));

      toast({
        title: "Task deleted",
        description: "Task has been removed successfully.",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!projectId) return;

    fetchTasks();

    // Subscribe to task changes
    const channel = supabase
      .channel("gantt-tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: projectId !== "all" ? `project_id=eq.${projectId}` : undefined,
        },
        (payload) => {
          console.log("Task changed:", payload);
          // Refetch tasks on any change
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    tasks,
    loading,
    dependencies,
    createTask,
    createDependency,
    deleteDependency,
    updateTask,
    updateTaskProgress,
    deleteTask,
    refetch: fetchTasks,
  };
};
