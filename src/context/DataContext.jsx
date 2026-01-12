import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [inbox, setInbox] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [language, setLanguage] = useState(() => {
    // Initial language: Check localStorage first, then browser
    const stored = localStorage.getItem('pm-app-language');
    if (stored) return stored;
    const browser = navigator.language || navigator.userLanguage;
    return browser?.startsWith('es') ? 'es' : 'en';
  });

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('pm-app-language', language);
  }, [language]);

  // Check for saved user session on mount (instant, no API calls)
  useEffect(() => {
    const savedUser = localStorage.getItem('pm-app-user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false); // Login page can now show immediately
  }, []);

  const initStarted = useRef(false);

  // Only load data from Supabase AFTER user is authenticated
  useEffect(() => {
    if (currentUser && !dataLoaded && !initStarted.current) {
      initStarted.current = true;

      // Add a small delay for page refreshes to ensure connection is stable
      const isInitialRefresh = !sessionStorage.getItem('veta-session-warmed');
      const delay = isInitialRefresh ? 500 : 0;

      if (isInitialRefresh) {
        sessionStorage.setItem('veta-session-warmed', 'true');
      }

      const timer = setTimeout(() => {
        loadAllData();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentUser, dataLoaded]);

  // Initialize auth listener
  useEffect(() => {

    // Listen for Supabase Auth changes (Google SSO)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const email = session.user.email;
        const metadata = session.user.user_metadata;

        try {
          // Check if user exists in our pm_users table
          const { data: existingUser } = await supabase
            .from('pm_users')
            .select('*')
            .eq('email', email)
            .single();

          if (existingUser) {
            setCurrentUser(existingUser);
            localStorage.setItem('pm-app-user', JSON.stringify(existingUser));
          } else {
            // Register new user
            const newUser = {
              name: metadata.full_name || email.split('@')[0],
              email: email,
              avatar: metadata.avatar_url || (metadata.full_name || email)[0].toUpperCase(),
            };

            const { data: createdUser, error } = await supabase
              .from('pm_users')
              .insert([newUser])
              .select()
              .single();

            if (error) {
              // If error is unique violation, it might have been created concurrently, try fetching again
              if (error.code === '23505') {
                const { data: retryUser } = await supabase
                  .from('pm_users')
                  .select('*')
                  .eq('email', email)
                  .single();
                if (retryUser) {
                  setCurrentUser(retryUser);
                  localStorage.setItem('pm-app-user', JSON.stringify(retryUser));
                }
              } else {
                console.error('Error creating user from SSO:', error);
              }
            } else {
              setCurrentUser(createdUser);
              localStorage.setItem('pm-app-user', JSON.stringify(createdUser));
              // Update local lists
              setUsers(prev => [createdUser, ...prev]);
            }
          }
        } catch (err) {
          console.error('Error syncing SSO user:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAllData = async () => {
    try {
      console.log('[Init] User authenticated, loading data...');

      // Helper to load with individual timeout and optional retry
      const loadWithRetry = async (name, fn, { timeoutMs = 20000, retries = 2 } = {}) => {
        let attempt = 0;
        const start = Date.now();

        while (attempt < retries) {
          attempt++;
          // Linear backoff for timeout: 20s, 30s...
          const currentTimeout = timeoutMs + ((attempt - 1) * 10000);

          if (attempt > 1) console.log(`[Init] Retrying ${name} (Attempt ${attempt}/${retries}) with ${currentTimeout}ms...`);

          try {
            // Create a promise that rejects on timeout
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('TIMEOUT')), currentTimeout)
            );

            // Race the function against the timeout
            await Promise.race([fn(), timeoutPromise]);

            console.log(`[Init] ✓ ${name} loaded in ${Date.now() - start}ms`);
            return; // Success
          } catch (err) {
            const isTimeout = err.message === 'TIMEOUT';
            const msg = isTimeout ? `timed out after ${currentTimeout}ms` : err.message;
            console.warn(`[Init] ⚠ ${name} failed attempt ${attempt}:`, err);

            if (attempt >= retries) {
              console.error(`[Init] ✘ ${name} failed all ${retries} attempts.`);
              if (['users', 'tasks'].includes(name)) {
                setConnectionError(true);
              }
            } else {
              // Backoff: 2s, 4s...
              await new Promise(r => setTimeout(r, attempt * 2000));
            }
          }
        }
      };

      // PHASE 1: Load critical data
      await Promise.all([
        loadWithRetry('users', loadUsers, { timeoutMs: 15000, retries: 3 }),
        // loadWithRetry('projects', loadProjects, { timeoutMs: 15000, retries: 3 }),
        loadWithRetry('tasks', loadTasks, { timeoutMs: 15000, retries: 3 }),
      ]);

      // Mark as loaded after critical data - app is now usable
      setDataLoaded(true);
      console.log('[Init] ✓ Phase 1 complete - critical data ready');

      // PHASE 2: Load secondary data in background
      // These are nice-to-have but not essential for initial render
      console.log('[Init] Phase 2: Loading secondary data in background...');
      const secondaryItems = [
        loadWithRetry('documents', loadDocuments, { timeoutMs: 30000, retries: 2 }),
        loadWithRetry('inbox', loadInbox, { timeoutMs: 30000, retries: 2 }),
        loadWithRetry('files', loadFiles, { timeoutMs: 30000, retries: 2 }),
      ];

      Promise.all(secondaryItems).then(() => {
        console.log('[Init] ✓ Phase 2 complete - secondary data ready');
      }).catch((err) => {
        console.warn('[Init] Some secondary data failed finally:', err);
      });

      // Subscribe to real-time changes
      setupRealtimeSubscriptions();

    } catch (err) {
      console.error('[Init] Critical error loading data:', err);
      setError(err.message);
      setDataLoaded(true); // Mark as done to prevent infinite loading
    }
  };

  // Load functions
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('pm_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('pm_projects')
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
        .from('pm_tasks')
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
        .from('pm_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setDocuments([]);
    }
  };

  const loadInbox = async () => {
    try {
      const { data, error } = await supabase
        .from('pm_inbox')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInbox(data || []);
    } catch (err) {
      console.error('Error loading inbox:', err);
      setInbox([]);
    }
  };

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('pm_files')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Error loading files:', err);
      setFiles([]);
    }
  };

  // Real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    // Subscribe to projects changes
    /*
    const projectsSubscription = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pm_projects' }, (payload) => {
        handleRealtimeUpdate('projects', payload);
      })
      .subscribe();
    */

    // Subscribe to tasks changes
    const tasksSubscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pm_tasks' }, (payload) => {
        handleRealtimeUpdate('tasks', payload);
      })
      .subscribe();

    // Subscribe to documents changes
    const documentsSubscription = supabase
      .channel('documents_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pm_documents' }, (payload) => {
        handleRealtimeUpdate('documents', payload);
      })
      .subscribe();

    // Subscribe to inbox changes
    const inboxSubscription = supabase
      .channel('inbox_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pm_inbox' }, (payload) => {
        handleRealtimeUpdate('inbox', payload);
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      projectsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
      documentsSubscription.unsubscribe();
      inboxSubscription.unsubscribe();
    };
  };

  const handleRealtimeUpdate = (table, payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (table) {
      case 'projects':
        if (eventType === 'INSERT') {
          setProjects(prev => {
            if (prev.some(p => p.id === newRecord.id)) return prev;
            return [newRecord, ...prev];
          });
        } else if (eventType === 'UPDATE') {
          setProjects(prev => prev.map(p => p.id === newRecord.id ? newRecord : p));
        } else if (eventType === 'DELETE') {
          const id = oldRecord.id;
          setProjects(prev => prev.filter(p => p.id !== id));
          // Explicitly clear nested items since DB cascade won't trigger UI events for them
          setTasks(prev => prev.filter(t => t.project_id !== id));
          setDocuments(prev => prev.filter(d => d.project_id !== id));
          setFiles(prev => prev.filter(f => f.project_id !== id));
        }
        break;
      case 'tasks':
        if (eventType === 'INSERT') {
          setTasks(prev => {
            if (prev.some(t => t.id === newRecord.id)) return prev;
            return [newRecord, ...prev];
          });
        } else if (eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === newRecord.id ? newRecord : t));
        } else if (eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== oldRecord.id));
        }
        break;
      case 'documents':
        if (eventType === 'INSERT') {
          setDocuments(prev => {
            if (prev.some(d => d.id === newRecord.id)) return prev;
            return [newRecord, ...prev];
          });
        } else if (eventType === 'UPDATE') {
          setDocuments(prev => prev.map(d => d.id === newRecord.id ? newRecord : d));
        } else if (eventType === 'DELETE') {
          setDocuments(prev => prev.filter(d => d.id !== oldRecord.id));
        }
        break;
      case 'inbox':
        if (eventType === 'INSERT') {
          setInbox(prev => {
            if (prev.some(i => i.id === newRecord.id)) return prev;
            return [newRecord, ...prev];
          });
        } else if (eventType === 'UPDATE') {
          setInbox(prev => prev.map(i => i.id === newRecord.id ? newRecord : i));
        } else if (eventType === 'DELETE') {
          setInbox(prev => prev.filter(i => i.id !== oldRecord.id));
        }
        break;
    }
  };

  // Auth Operations
  const login = async (emailData) => {
    try {
      const { data: user, error } = await supabase
        .from('pm_users')
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

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error logging in with Google:', err);
      throw err;
    }
  };

  const logout = () => {
    // Clear state IMMEDIATELY - don't wait for Supabase
    setCurrentUser(null);
    setDataLoaded(false);
    initStarted.current = false;
    setConnectionError(false);
    setProjects([]);
    setTasks([]);
    setDocuments([]);
    setInbox([]);
    setFiles([]);
    setUsers([]);
    localStorage.removeItem('pm-app-user');

    // Fire-and-forget Supabase signOut (don't await)
    supabase.auth.signOut().catch(err => console.warn('Supabase signOut error:', err));
  };

  const register = async (userData) => {
    try {
      const newUser = {
        name: userData.name,
        email: userData.email,
        avatar: userData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      };

      const { data, error } = await supabase
        .from('pm_users')
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

  const createTeamMember = async (name) => {
    try {
      // Create a placeholder email
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`;
      const newUser = {
        name: name,
        email: email,
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      };

      const { data, error } = await supabase
        .from('pm_users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        // If duplicate email (placeholder collision), try appending random string
        if (error.code === '23505') {
          const randomSuffix = Math.floor(Math.random() * 1000);
          newUser.email = `${name.toLowerCase().replace(/\s+/g, '.')}${randomSuffix}@placeholder.com`;
          const { data: retryData, error: retryError } = await supabase
            .from('pm_users')
            .insert([newUser])
            .select()
            .single();
          if (retryError) throw retryError;
          setUsers(prev => [retryData, ...prev]);
          return retryData;
        }
        throw error;
      }

      setUsers(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating team member:', err);
      throw err;
    }
  };

  // User Management
  const updateUser = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('pm_users')
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
        .from('pm_users')
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
    if (!currentUser?.id) {
      console.error('Cannot create project: No currentUser available');
      throw new Error('User session missing. Please log in again.');
    }

    try {
      const newProject = {
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status || 'Planning',
        owner_id: currentUser.id,
        members: [currentUser.id],
      };

      console.log('Creating project in Supabase:', newProject);

      const { data, error } = await Promise.race([
        supabase
          .from('pm_projects')
          .insert([newProject])
          .select()
          .single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Project creation timed out. Please try again.')), 30000)
        )
      ]);

      if (error) {
        console.error('Supabase error creating project:', error);
        throw error;
      }

      console.log('Project created successfully:', data);
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
        .from('pm_projects')
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
        .from('pm_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      // Manually clean up state for cascade deleted items
      setTasks(prev => prev.filter(t => t.project_id !== projectId));
      setDocuments(prev => prev.filter(d => d.project_id !== projectId));
      setFiles(prev => prev.filter(f => f.project_id !== projectId));
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
        action_type: taskData.actionType || taskData.action_type || 'todo',
      };

      const { data, error } = await supabase
        .from('pm_tasks')
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
        action_type: task.actionType || task.action_type || 'todo',
      }));

      const { data, error } = await Promise.race([
        supabase
          .from('pm_tasks')
          .insert(newTasks)
          .select(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Task creation timed out. Please try again.')), 60000)
        )
      ]);

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
      const dbUpdates = {};
      const getVal = (key1, key2) => updates[key1] !== undefined ? updates[key1] : updates[key2];

      if (getVal('name', 'name') !== undefined) dbUpdates.name = getVal('name', 'name');
      if (getVal('description', 'description') !== undefined) dbUpdates.description = getVal('description', 'description');
      if (getVal('dueDate', 'due_date') !== undefined) dbUpdates.due_date = getVal('dueDate', 'due_date');
      if (getVal('assignedTo', 'assigned_to') !== undefined) {
        const val = getVal('assignedTo', 'assigned_to');
        dbUpdates.assigned_to = (val === '' || val === 'null' || val === 'undefined') ? null : val;
      }
      if (getVal('status', 'status') !== undefined) dbUpdates.status = getVal('status', 'status');
      if (getVal('projectId', 'project_id') !== undefined) dbUpdates.project_id = getVal('projectId', 'project_id');
      if (getVal('actionType', 'action_type') !== undefined) dbUpdates.action_type = getVal('actionType', 'action_type');

      const { data, error } = await supabase
        .from('pm_tasks')
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
        .from('pm_tasks')
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
        .from('pm_documents')
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
        .from('pm_documents')
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
        .from('pm_documents')
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

  // Inbox CRUD
  const createInboxItem = async (content, language = null) => {
    // Guard against missing user
    if (!currentUser?.id) {
      console.warn('Cannot create inbox item: No current user');
      return null;
    }

    // 1. Optimistic Update (Immediate UI Feedback)
    const tempId = 'temp-' + Date.now();
    const optimisticItem = {
      id: tempId,
      content,
      language,
      user_id: currentUser.id,
      processed: false,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    // Update local state immediately
    setInbox(prev => [optimisticItem, ...prev]);

    // 2. Real Save (Await to ensure persistence)
    try {
      const newItem = {
        content,
        language,
        user_id: currentUser.id,
        processed: false
      };

      const { data, error } = await supabase
        .from('pm_inbox')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      // Replace temp item with real data
      setInbox(prev => prev.map(item => item.id === tempId ? data : item));
      return data;
    } catch (err) {
      console.error('Error creating inbox item:', err);
      // Mark as error in UI
      setInbox(prev => prev.map(item => item.id === tempId ? { ...item, error: true } : item));
      throw err;
    }
  };

  const updateInboxItem = async (itemId, updates) => {
    try {
      const { data, error } = await supabase
        .from('pm_inbox')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      setInbox(prev => prev.map(i => i.id === itemId ? data : i));
    } catch (err) {
      console.error('Error updating inbox item:', err);
      throw err;
    }
  };

  const deleteInboxItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('pm_inbox')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setInbox(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Error deleting inbox item:', err);
      throw err;
    }
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
        .from('pm_files')
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
        .from('pm_files')
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

  // ============================================
  // VOICE-FIRST ACCOUNTABILITY HELPERS
  // ============================================

  // Get all tasks assigned to a specific user
  const getTasksByUser = (userId) => {
    return tasks.filter(t => t.assigned_to === userId);
  };

  // Get all overdue tasks
  const getOverdueTasks = () => {
    const today = new Date();
    return tasks.filter(t =>
      t.status !== 'Done' &&
      t.due_date &&
      new Date(t.due_date) < today
    );
  };

  // Get tasks due within next N days (default 7)
  const getTasksDueWithin = (days = 7) => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + days);

    return tasks.filter(t => {
      if (t.status === 'Done' || !t.due_date) return false;
      const due = new Date(t.due_date);
      return due >= today && due <= future;
    });
  };

  // Get tasks due this week (convenience)
  const getTasksDueThisWeek = () => getTasksDueWithin(7);

  // Fuzzy match user by name (for voice queries)
  const getUserByName = (name) => {
    if (!name) return null;
    const lowName = name.toLowerCase().trim();

    // Exact match first
    let match = users.find(u => u.name.toLowerCase() === lowName);
    if (match) return match;

    // First name match
    match = users.find(u => u.name.toLowerCase().startsWith(lowName));
    if (match) return match;

    // Contains match
    match = users.find(u => u.name.toLowerCase().includes(lowName));
    return match || null;
  };

  // Get pending tasks (not done) for a user by name
  const getPendingTasksForPerson = (personName) => {
    const user = getUserByName(personName);
    if (!user) return [];
    return tasks.filter(t => t.assigned_to === user.id && t.status !== 'Done');
  };

  // Get voice-created tasks
  const getVoiceCreatedTasks = () => {
    return tasks.filter(t => t.source === 'voice');
  };

  const value = {
    // Data
    users,
    currentUser,
    projects,
    tasks,
    documents,
    inbox,
    files,
    loading,
    dataLoaded,
    error,
    connectionError,

    language,
    setLanguage,

    // Auth
    login,
    loginWithGoogle,
    logout,
    register,

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

    // Inbox operations
    createInboxItem,
    updateInboxItem,
    deleteInboxItem,

    // File operations
    uploadFile,
    deleteFile,
    getProjectFiles,

    // User operations
    createTeamMember,
    updateUser,
    deleteUser,

    // Helpers
    getUser,
    getTaskStats,
    getProjectProgress,

    // Voice-First Accountability Helpers
    getTasksByUser,
    getOverdueTasks,
    getTasksDueWithin,
    getTasksDueThisWeek,
    getUserByName,
    getPendingTasksForPerson,
    getVoiceCreatedTasks,
  };

  return (
    <DataContext.Provider value={value} >
      {children}
    </DataContext.Provider >
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
