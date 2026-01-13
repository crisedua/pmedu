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
    const initAuth = async () => {
      // Reset data loading state on mount/refresh
      setDataLoaded(false);
      initStarted.current = false;

      const savedUser = localStorage.getItem('pm-app-user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));

        // Try to restore Supabase session in background (for SSO users)
        // but don't block on it
        supabase.auth.getSession().catch(err => {
          console.warn('Failed to restore Supabase session:', err);
        });
      }
      setLoading(false); // Login page can now show immediately
    };

    initAuth();
  }, []);

  const initStarted = useRef(false);

  // Only load data from Supabase AFTER user is authenticated
  useEffect(() => {
    // #region agent log
    console.log('[DEBUG-EFFECT] Data loading effect triggered:', {
      hasCurrentUser: !!currentUser,
      dataLoaded,
      initStarted: initStarted.current,
      willLoadData: !!(currentUser && !dataLoaded && !initStarted.current)
    });
    // #endregion

    if (currentUser && !dataLoaded && !initStarted.current) {
      initStarted.current = true;
      console.log('[DEBUG-EFFECT] Starting data load timer');

      // Add a delay for page refreshes to ensure Supabase session is ready
      const isInitialRefresh = !sessionStorage.getItem('veta-session-warmed');
      // Increase delay to give Supabase more time to restore session
      const delay = isInitialRefresh ? 1500 : 300;

      if (isInitialRefresh) {
        sessionStorage.setItem('veta-session-warmed', 'true');
      }

      const timer = setTimeout(() => {
        console.log('[DEBUG-EFFECT] Timer fired, loading data now');

        // Don't wait for session - just load data directly
        // (session check was hanging on refresh)
        console.log('[DEBUG-EFFECT] About to call loadAllData()');
        loadAllData().catch(err => {
          console.error('[DEBUG-EFFECT] loadAllData() error:', err);
        });
        console.log('[DEBUG-EFFECT] loadAllData() called');
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
            .from('aido_users')
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
              .from('aido_users')
              .insert([newUser])
              .select()
              .single();

            if (error) {
              // If error is unique violation, it might have been created concurrently, try fetching again
              if (error.code === '23505') {
                const { data: retryUser } = await supabase
                  .from('aido_users')
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
    console.log('[DEBUG-LOADALL] loadAllData called - START');
    try {
      console.log('[Init] User authenticated, loading data...');

      // Helper to load with individual timeout and optional retry
      const loadWithRetry = async (name, fn, { timeoutMs = 20000, retries = 2 } = {}) => {
        let attempt = 0;
        const start = Date.now();

        // #region agent log
        console.log(`[DEBUG-E] loadWithRetry:start - Starting ${name}:`, { name, timeoutMs, retries });
        // #endregion

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
            // #region agent log
            console.log(`[DEBUG-E] loadWithRetry:success - SUCCESS ${name}:`, { name, attempt, durationMs: Date.now() - start });
            // #endregion
            return; // Success
          } catch (err) {
            const isTimeout = err.message === 'TIMEOUT';
            const msg = isTimeout ? `timed out after ${currentTimeout}ms` : err.message;
            console.warn(`[Init] ⚠ ${name} failed attempt ${attempt}:`, err);

            // #region agent log
            console.log(`[DEBUG-E] loadWithRetry:failed - FAILED ${name} attempt ${attempt}:`, { name, attempt, isTimeout, errorMsg: err.message, durationMs: Date.now() - start });
            // #endregion

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
  // Load functions
  const loadUsers = async () => {
    // #region agent log
    console.log('[DEBUG-A] loadUsers:entry - loadUsers started');
    // #endregion
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error('Missing Supabase env vars');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const fetchStart = Date.now();
      console.log('[DEBUG-A] loadUsers:rawFetch - starting raw fetch with anon key');

      const response = await fetch(`${url}/rest/v1/pm_users?select=*&order=created_at.desc`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[DEBUG-A] loadUsers:rawFetchDone', { status: response.status, ok: response.ok, durationMs: Date.now() - fetchStart });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Fetch users failed ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log('[DEBUG-A] loadUsers:result - Query completed:', { hasError: false, dataCount: data?.length || 0 });
      setUsers(data || []);
    } catch (err) {
      // #region agent log
      console.log('[DEBUG-A] loadUsers:error - loadUsers failed:', { error: err.message });
      // #endregion
      console.error('Error loading users:', err);
      throw err;
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('aido_projects')
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
    // #region agent log
    const taskStart = Date.now();
    console.log('[DEBUG-D] loadTasks:entry - loadTasks started');
    // #endregion
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error('Missing Supabase env vars');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      console.log('[DEBUG-D] loadTasks:rawFetch - starting raw fetch with anon key');

      const response = await fetch(`${url}/rest/v1/pm_tasks?select=*&order=created_at.desc`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[DEBUG-D] loadTasks:rawFetchDone', { status: response.status, ok: response.ok, durationMs: Date.now() - taskStart });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Fetch tasks failed ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log('[DEBUG-D] loadTasks:result - Query completed:', { hasError: false, dataCount: data?.length || 0, durationMs: Date.now() - taskStart });
      setTasks(data || []);
    } catch (err) {
      // #region agent log
      console.log('[DEBUG-D] loadTasks:error - loadTasks failed:', { error: err.message });
      // #endregion
      console.error('Error loading tasks (diagnostic):', {
        message: err.message,
        stack: err.stack,
        url: import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
      console.error('Error loading tasks:', err);
      setTasks([]);
    }
  };

  const loadDocuments = async () => {
    // #region agent log
    const docStart = Date.now();
    console.log('[DEBUG-D] loadDocuments:entry - loadDocuments started');
    // #endregion
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error('Missing Supabase env vars');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      console.log('[DEBUG-D] loadDocuments:rawFetch - starting raw fetch with anon key');

      const response = await fetch(`${url}/rest/v1/pm_documents?select=*&order=created_at.desc`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[DEBUG-D] loadDocuments:rawFetchDone', { status: response.status, ok: response.ok, durationMs: Date.now() - docStart });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Fetch documents failed ${response.status}: ${text}`);
      }

      const data = await response.json();
      // #region agent log
      console.log('[DEBUG-D] loadDocuments:result - Query completed:', { hasError: false, dataCount: data?.length || 0, durationMs: Date.now() - docStart });
      // #endregion
      setDocuments(data || []);
    } catch (err) {
      // #region agent log
      console.log('[DEBUG-D] loadDocuments:error - loadDocuments failed:', { error: err.message });
      // #endregion
      console.error('Error loading documents (diagnostic):', {
        message: err.message,
        stack: err.stack,
        url: import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
      console.error('Error loading documents:', err);
      setDocuments([]);
    }
  };

  const loadInbox = async () => {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error('Missing Supabase env vars');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      console.log('[DEBUG-E] loadInbox:rawFetch - starting raw fetch with anon key');

      const response = await fetch(`${url}/rest/v1/pm_inbox?select=*&order=created_at.desc`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[DEBUG-E] loadInbox:rawFetchDone', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Fetch inbox failed ${response.status}: ${text}`);
      }

      const data = await response.json();
      setInbox(data || []);
    } catch (err) {
      console.error('Error loading inbox (diagnostic):', {
        message: err.message,
        stack: err.stack,
        url: import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
      console.error('Error loading inbox:', err);
      setInbox([]);
    }
  };

  const loadFiles = async () => {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error('Missing Supabase env vars');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      console.log('[DEBUG-E] loadFiles:rawFetch - starting raw fetch with anon key');

      const response = await fetch(`${url}/rest/v1/pm_files?select=*&order=upload_date.desc`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[DEBUG-E] loadFiles:rawFetchDone', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Fetch files failed ${response.status}: ${text}`);
      }

      const data = await response.json();
      setFiles(data || []);
    } catch (err) {
      console.error('Error loading files (diagnostic):', {
        message: err.message,
        stack: err.stack,
        url: import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aido_projects' }, (payload) => {
        handleRealtimeUpdate('projects', payload);
      })
      .subscribe();
    */

    // Subscribe to tasks changes
    const tasksSubscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aido_tasks' }, (payload) => {
        handleRealtimeUpdate('tasks', payload);
      })
      .subscribe();

    // Subscribe to documents changes
    const documentsSubscription = supabase
      .channel('documents_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aido_documents' }, (payload) => {
        handleRealtimeUpdate('documents', payload);
      })
      .subscribe();

    // Subscribe to inbox changes
    const inboxSubscription = supabase
      .channel('inbox_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aido_inbox' }, (payload) => {
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
        .from('aido_users')
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
        .from('aido_users')
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
        .from('aido_users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        // If duplicate email (placeholder collision), try appending random string
        if (error.code === '23505') {
          const randomSuffix = Math.floor(Math.random() * 1000);
          newUser.email = `${name.toLowerCase().replace(/\s+/g, '.')}${randomSuffix}@placeholder.com`;
          const { data: retryData, error: retryError } = await supabase
            .from('aido_users')
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
        .from('aido_users')
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
        .from('aido_users')
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
          .from('aido_projects')
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
        .from('aido_projects')
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
        .from('aido_projects')
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
        .from('aido_tasks')
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
          .from('aido_tasks')
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
        .from('aido_tasks')
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
        .from('aido_tasks')
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
        .from('aido_documents')
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
        .from('aido_documents')
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
        .from('aido_documents')
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
        .from('aido_inbox')
        .insert([newItem])
        .select()
        .single();

      if (error) {
        // Surface the error for debugging
        console.error('Supabase insert error (pm_inbox):', error);
        throw error;
      }

      // Replace temp item with real data
      setInbox(prev => prev.map(item => item.id === tempId ? data : item));
      return data;
    } catch (err) {
      console.error('Error creating inbox item (diagnostic):', {
        message: err.message,
        stack: err.stack,
        url: import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
      console.error('Error creating inbox item:', err);
      // Mark as error in UI
      setInbox(prev => prev.map(item => item.id === tempId ? { ...item, error: true, errorMessage: err.message } : item));
      throw err;
    }
  };

  const updateInboxItem = async (itemId, updates) => {
    try {
      const { data, error } = await supabase
        .from('aido_inbox')
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
    console.log('[DataContext] deleteInboxItem called for:', itemId);

    // 1. Optimistic UI Update (Immediate)
    const previousInbox = [...inbox];
    setInbox(prev => prev.filter(i => i.id !== itemId));

    try {
      // 2. Perform Delete with Timeout Protection
      const deletePromise = supabase
        .from('aido_inbox')
        .delete({ count: 'exact' })
        .eq('id', itemId);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );

      const { error, count } = await Promise.race([deletePromise, timeoutPromise]);

      console.log('[DataContext] Supabase delete output:', { error, count });

      if (error) throw error;

      if (count === 0) {
        console.warn('[DataContext] Delete succeeded but 0 rows affected. Check RLS or ID. Reverting UI.');
        // Revert if likely a permissions/logic error
        setInbox(previousInbox);
        throw new Error('Item not found or permission denied');
      }

    } catch (err) {
      console.error('Error deleting inbox item:', err);
      // Revert UI on failure
      setInbox(previousInbox);
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
        .from('aido_files')
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
        .from('aido_files')
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
  };

  // Demo Reset / Seeding Function
  const resetDemoData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      console.log('[Demo Reset] Starting DB wipe and seed...');

      // 1. Wipe existing data (Inbox, Tasks, Projects)
      await supabase.from('aido_inbox').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('aido_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('aido_projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      console.log('[Demo Reset] Wiped data. Seeding new Spanish data...');

      // 2. Create Projects
      const newProjects = [
        { name: 'Lanzamiento Web 2.0', status: 'Active', owner_id: currentUser.id },
        { name: 'Campaña Marketing Q1', status: 'Planning', owner_id: currentUser.id },
        { name: 'Expansión Latam', status: 'Active', owner_id: currentUser.id }
      ];

      // Insert and get IDs
      const { data: projectsData, error: projError } = await supabase.from('aido_projects').insert(newProjects).select();
      if (projError) throw projError;

      const pMap = {};
      projectsData.forEach(p => pMap[p.name] = p.id);

      // 3. Create Tasks
      const newTasks = [
        {
          name: 'Revisar Presupuesto Q1',
          description: 'Analizar discrepancias en gastos de marketing',
          status: 'To Do',
          project_id: pMap['Campaña Marketing Q1'],
          assigned_to: currentUser.id,
          due_date: new Date(Date.now() + 86400000).toISOString(),
          created_by_ai: false
        },
        {
          name: 'Entrevistar candidato Senior Dev',
          description: 'Revisar portafolio antes de la llamada',
          status: 'To Do',
          project_id: pMap['Lanzamiento Web 2.0'],
          assigned_to: currentUser.id,
          due_date: new Date(Date.now() + 172800000).toISOString(),
          created_by_ai: false
        },
        {
          name: 'Enviar reporte mensual a inversores',
          description: 'Incluir métricas de crecimiento y retención',
          status: 'To Do',
          project_id: pMap['Expansión Latam'],
          assigned_to: currentUser.id,
          due_date: new Date(Date.now() + 345600000).toISOString(),
          created_by_ai: false
        }
      ];
      await supabase.from('aido_tasks').insert(newTasks);

      // 4. Create Inbox
      const newInbox = [
        { content: 'Recordar pedir feedback a Laura sobre la presentación de ventas de ayer, necesito incorporarlo antes del lunes.', processed: false, user_id: currentUser.id, language: 'es' },
        { content: 'Llamar a Proveedores Inc. para renegociar el contrato anual, decirles que tenemos una oferta mejor de la competencia y ver si pueden igualarla.', processed: false, user_id: currentUser.id, language: 'es' },
        { content: 'Idea para el blog: 5 formas de usar nuestra herramienta para ahorrar tiempo. Redactar borrador para el viernes y pedirle a Carlos que haga los gráficos.', processed: false, user_id: currentUser.id, language: 'es' },
        { content: 'Confirmar asistencia al evento de networking del próximo martes y preparar tarjetas de visita.', processed: false, user_id: currentUser.id, language: 'es' }
      ];
      await supabase.from('aido_inbox').insert(newInbox);

      console.log('[Demo Reset] Seeding complete. Reloading...');
      await loadAllData();
      setLoading(false);
      window.location.reload();

    } catch (err) {
      console.error('[Demo Reset] Failed:', err);
      setLoading(false);
      alert('Error resetting demo data: ' + err.message);
    }
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
    getPendingTasksForPerson,
    getVoiceCreatedTasks,
    resetDemoData, // Export the reset function
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
