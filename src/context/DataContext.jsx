import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DataContext = createContext();

// Sample users for demo (will be migrated to DB)
const SAMPLE_USERS = [
  { id: 'user-1', name: 'Alex Johnson', email: 'alex@company.com', avatar: 'AJ' },
  { id: 'user-2', name: 'Maria Garcia', email: 'maria@company.com', avatar: 'MG' },
  { id: 'user-3', name: 'Juan Rodriguez', email: 'juan@company.com', avatar: 'JR' },
  { id: 'user-4', name: 'Sarah Chen', email: 'sarah@company.com', avatar: 'SC' },
];

export function DataProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize data from Supabase
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current user session from localStorage
      const savedUser = localStorage.getItem('pm-app-user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      // Load all data from Supabase
      await Promise.all([
        loadUsers(),
        loadProjects(),
        loadTasks(),
        loadDocuments(),
        loadFiles(),
      ]);

      // Subscribe to real-time changes
      setupRealtimeSubscriptions();
    } catch (err) {
      console.error('Error initializing app:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load functions
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If no users in DB, seed with sample users
      if (!data || data.length === 0) {
        await seedSampleUsers();
      } else {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      // Fallback to sample users if DB fails
      setUsers(SAMPLE_USERS);
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error loading projects:', err);
      setProjects([]);
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setTasks([]);
    }
  };

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setDocuments([]);
    }
  };

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Error loading files:', err);
      setFiles([]);
    }
  };

  // Seed sample users
  const seedSampleUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(SAMPLE_USERS)
        .select();

      if (error) throw error;
      setUsers(data || SAMPLE_USERS);
    } catch (err) {
      console.error('Error seeding users:', err);
      setUsers(SAMPLE_USERS);
    }
  };

  // Real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    // Subscribe to projects changes
    const projectsSubscription = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        handleRealtimeUpdate('projects', payload);
      })
      .subscribe();

    // Subscribe to tasks changes
    const tasksSubscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        handleRealtimeUpdate('tasks', payload);
      })
      .subscribe();

    // Subscribe to documents changes
    const documentsSubscription = supabase
      .channel('documents_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, (payload) => {
        handleRealtimeUpdate('documents', payload);
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      projectsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
      documentsSubscription.unsubscribe();
    };
  };

  const handleRealtimeUpdate = (table, payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (table) {
      case 'projects':
        if (eventType === 'INSERT') {
          setProjects(prev => [newRecord, ...prev]);
        } else if (eventType === 'UPDATE') {
          setProjects(prev => prev.map(p => p.id === newRecord.id ? newRecord : p));
        } else if (eventType === 'DELETE') {
          setProjects(prev => prev.filter(p => p.id !== oldRecord.id));
        }
        break;
      case 'tasks':
        if (eventType === 'INSERT') {
          setTasks(prev => [newRecord, ...prev]);
        } else if (eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === newRecord.id ? newRecord : t));
        } else if (eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== oldRecord.id));
        }
        break;
      case 'documents':
        if (eventType === 'INSERT') {
          setDocuments(prev => [newRecord, ...prev]);
        } else if (eventType === 'UPDATE') {
          setDocuments(prev => prev.map(d => d.id === newRecord.id ? newRecord : d));
        } else if (eventType === 'DELETE') {
          setDocuments(prev => prev.filter(d => d.id !== oldRecord.id));
        }
        break;
    }
  };

  // Auth Operations
  const login = async (emailData) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', emailData)
        .single();

      if (error) throw error;

      if (user) {
        setCurrentUser(user);
        localStorage.setItem('pm-app-user', JSON.stringify(user));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pm-app-user');
  };

  const register = async (userData) => {
    try {
      const newUser = {
        name: userData.name,
        email: userData.email,
        avatar: userData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Email already exists');
        }
        throw error;
      }

      // Auto login after register
      setCurrentUser(data);
      localStorage.setItem('pm-app-user', JSON.stringify(data));
      setUsers(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  };

  // User Management
  const updateUser = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? data : u));

      // Update current user if it's them
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(data);
        localStorage.setItem('pm-app-user', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const deleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== userId));
      if (currentUser?.id === userId) {
        logout();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  // Project CRUD
  const createProject = async (projectData) => {
    try {
      const newProject = {
        name: projectData.name,
        description: projectData.description,
        status: projectData.status || 'Planning',
        owner_id: currentUser.id,
        members: [currentUser.id],
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => prev.map(p => p.id === projectId ? data : p));
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      // Cascade delete is handled by database constraints
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  const getProject = (projectId) => {
    return projects.find(p => p.id === projectId);
  };

  // Task CRUD
  const createTask = async (taskData) => {
    try {
      const newTask = {
        name: taskData.name,
        description: taskData.description,
        due_date: taskData.dueDate || taskData.due_date,
        assigned_to: (taskData.assignedTo || taskData.assigned_to) || null,
        status: taskData.status || 'To Do',
        project_id: taskData.projectId || taskData.project_id,
        created_by_ai: taskData.createdByAI || taskData.created_by_ai || false,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  const createMultipleTasks = async (tasksData) => {
    try {
      const newTasks = tasksData.map(task => ({
        name: task.name,
        description: task.description,
        due_date: task.dueDate || task.due_date,
        assigned_to: (task.assignedTo || task.assigned_to) || null,
        status: task.status || 'To Do',
        project_id: task.projectId || task.project_id,
        created_by_ai: task.created_by_ai !== undefined ? task.created_by_ai : true,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTasks)
        .select();

      if (error) throw error;

      setTasks(prev => [...data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating multiple tasks:', err);
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      // Map camelCase to snake_case for database
      const dbUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  const getProjectTasks = (projectId) => {
    return tasks.filter(t => t.project_id === projectId);
  };

  // Document CRUD
  const createDocument = async (docData) => {
    try {
      const newDoc = {
        title: docData.title,
        content: docData.content || '',
        project_id: docData.projectId,
        author_id: currentUser.id,
      };

      const { data, error } = await supabase
        .from('documents')
        .insert([newDoc])
        .select()
        .single();

      if (error) throw error;

      setDocuments(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating document:', err);
      throw err;
    }
  };

  const updateDocument = async (docId, updates) => {
    try {
      const dbUpdates = {
        ...updates,
        last_edited: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('documents')
        .update(dbUpdates)
        .eq('id', docId)
        .select()
        .single();

      if (error) throw error;

      setDocuments(prev => prev.map(d => d.id === docId ? data : d));
    } catch (err) {
      console.error('Error updating document:', err);
      throw err;
    }
  };

  const deleteDocument = async (docId) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
    }
  };

  const getDocument = (docId) => {
    return documents.find(d => d.id === docId);
  };

  const getProjectDocuments = (projectId) => {
    return documents.filter(d => d.project_id === projectId);
  };

  // File CRUD
  const uploadFile = async (fileData) => {
    try {
      const newFile = {
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        project_id: fileData.projectId,
        uploaded_by: currentUser.id,
      };

      const { data, error } = await supabase
        .from('files')
        .insert([newFile])
        .select()
        .single();

      if (error) throw error;

      setFiles(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  };

  const deleteFile = async (fileId) => {
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Error deleting file:', err);
      throw err;
    }
  };

  const getProjectFiles = (projectId) => {
    return files.filter(f => f.project_id === projectId);
  };

  // Helper functions
  const getUser = (userId) => {
    return users.find(u => u.id === userId);
  };

  const getTaskStats = (projectId) => {
    const projectTasks = getProjectTasks(projectId);
    return {
      total: projectTasks.length,
      todo: projectTasks.filter(t => t.status === 'To Do').length,
      inProgress: projectTasks.filter(t => t.status === 'In Progress').length,
      done: projectTasks.filter(t => t.status === 'Done').length,
    };
  };

  const getProjectProgress = (projectId) => {
    const stats = getTaskStats(projectId);
    if (stats.total === 0) return 0;
    return Math.round((stats.done / stats.total) * 100);
  };

  const value = {
    // Data
    users,
    currentUser,
    projects,
    tasks,
    documents,
    files,
    loading,
    error,

    // Project operations
    createProject,
    updateProject,
    deleteProject,
    getProject,

    // Task operations
    createTask,
    createMultipleTasks,
    updateTask,
    deleteTask,
    getProjectTasks,

    // Document operations
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    getProjectDocuments,

    // File operations
    uploadFile,
    deleteFile,
    getProjectFiles,

    // Auth
    login,
    logout,
    register,

    // User operations
    updateUser,
    deleteUser,

    // Helpers
    getUser,
    getTaskStats,
    getProjectProgress,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
