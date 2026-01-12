import { createContext, useContext, useState } from 'react';

// Mock data for demo mode
const MOCK_USERS = [
    { id: 'user-1', name: 'Demo User', email: 'demo@example.com', avatar: '👤', role: 'admin' },
    { id: 'user-2', name: 'Sarah Chen', email: 'sarah@example.com', avatar: '👩', role: 'member' },
    { id: 'user-3', name: 'Juan Rodriguez', email: 'juan@example.com', avatar: '👨', role: 'member' },
    { id: 'user-4', name: 'Gonzalo Martinez', email: 'gonzalo@example.com', avatar: '🧑', role: 'member' },
];

const MOCK_PROJECTS = [
    { id: 'proj-1', name: 'Marketing Campaign Q1', status: 'Active', color: '#6366f1' },
    { id: 'proj-2', name: 'Website Redesign', status: 'Planning', color: '#10b981' },
    { id: 'proj-3', name: 'Product Launch', status: 'Active', color: '#f59e0b' },
];

const INITIAL_TASKS = [
    {
        id: 'task-1',
        name: 'Solicitar informe de ACME',
        description: 'Request quarterly report from ACME client',
        status: 'To Do',
        assigned_to: 'user-4',
        project_id: 'proj-1',
        due_date: '2026-01-12',
        created_at: '2026-01-10T10:00:00Z',
        action_type: 'delegate'
    },
    {
        id: 'task-2',
        name: 'Coordinar reunión con Juan',
        description: 'Schedule meeting to discuss project timeline',
        status: 'To Do',
        assigned_to: 'user-3',
        project_id: 'proj-2',
        due_date: '2026-01-17',
        created_at: '2026-01-09T14:00:00Z',
        action_type: 'delegate'
    },
    {
        id: 'task-3',
        name: 'Consultar resumen del proyecto X',
        description: 'Get project X summary from Cote',
        status: 'To Do',
        assigned_to: 'user-2',
        project_id: 'proj-3',
        due_date: '2026-01-12',
        created_at: '2026-01-08T09:00:00Z',
        action_type: 'delegate'
    },
];

const INITIAL_INBOX = [
    {
        id: 'inbox-1',
        content: 'Te pedí a Gonzalo que me envíe un informe de ACME, llamar a Juan para coordinar reunión el miércoles, decirle a Cote si terminó el resumen del proyecto X.',
        processed: false,
        created_at: '2026-01-12T08:30:00Z',
        source: 'voice'
    },
    {
        id: 'inbox-2',
        content: 'Test 10, 1, 2, 3, today I need to do this, that, that, and then this.',
        processed: false,
        created_at: '2026-01-12T09:15:00Z',
        source: 'voice'
    },
    {
        id: 'inbox-3',
        content: "Yes? I'm here on Rex Mayhew's behalf. Oh yeah, you were at his house the day of the birthday party. Yes. And we need to talk. Um, so, where's Rex? Get your things, make your excuses, I'll tell you everything in the car.",
        processed: false,
        created_at: '2026-01-11T16:45:00Z',
        source: 'voice'
    },
    {
        id: 'inbox-4',
        content: "Maybe somebody will answer for her. Ray and Hannah are at her office now. I'll circle back in a bit, okay? Got it.",
        processed: false,
        created_at: '2026-01-11T11:20:00Z',
        source: 'voice'
    },
];

const DemoDataContext = createContext(null);

export function DemoDataProvider({ children }) {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [inbox, setInbox] = useState(INITIAL_INBOX);
    const [users] = useState(MOCK_USERS);
    const [projects] = useState(MOCK_PROJECTS);
    const currentUser = MOCK_USERS[0];

    // Helper functions
    const getUser = (userId) => users.find(u => u.id === userId);
    const getProject = (projectId) => projects.find(p => p.id === projectId);

    // Task operations
    const updateTask = (taskId, updates) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    };

    const deleteTask = (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const createTask = (taskData) => {
        const newTask = {
            id: `task-${Date.now()}`,
            status: 'To Do',
            created_at: new Date().toISOString(),
            ...taskData
        };
        setTasks(prev => [...prev, newTask]);
        return newTask;
    };

    // Inbox operations
    const updateInboxItem = (itemId, updates) => {
        setInbox(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
    };

    const deleteInboxItem = (itemId) => {
        setInbox(prev => prev.filter(i => i.id !== itemId));
    };

    const addInboxItem = (content) => {
        const newItem = {
            id: `inbox-${Date.now()}`,
            content,
            processed: false,
            created_at: new Date().toISOString(),
            source: 'voice'
        };
        setInbox(prev => [newItem, ...prev]);
        return newItem;
    };

    // Move inbox to task
    const processInboxToTask = (inboxItem, taskData) => {
        const newTask = createTask({
            name: taskData.name || inboxItem.content.substring(0, 50),
            description: inboxItem.content,
            assigned_to: taskData.assigned_to || currentUser.id,
            action_type: taskData.action_type || 'todo',
            ...taskData
        });
        updateInboxItem(inboxItem.id, { processed: true });
        return newTask;
    };

    const value = {
        tasks,
        inbox,
        users,
        projects,
        currentUser,
        dataLoaded: true,
        loading: false,
        connectionError: null,
        getUser,
        getProject,
        updateTask,
        deleteTask,
        createTask,
        updateInboxItem,
        deleteInboxItem,
        addInboxItem,
        processInboxToTask,
    };

    return (
        <DemoDataContext.Provider value={value}>
            {children}
        </DemoDataContext.Provider>
    );
}

export function useDemoData() {
    const context = useContext(DemoDataContext);
    if (!context) {
        throw new Error('useDemoData must be used within a DemoDataProvider');
    }
    return context;
}

export default DemoDataContext;
