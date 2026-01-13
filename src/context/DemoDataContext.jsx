import { createContext, useContext, useState } from 'react';

// Mock data for demo mode
const MOCK_USERS = [
    { id: 'user-1', name: 'Demo User', email: 'demo@example.com', avatar: '👤', role: 'admin' },
    { id: 'user-2', name: 'Ana Garcia', email: 'ana@example.com', avatar: '👩', role: 'member' },
    { id: 'user-3', name: 'Carlos Ruiz', email: 'carlos@example.com', avatar: '👨', role: 'member' },
    { id: 'user-4', name: 'Sofia Lopez', email: 'sofia@example.com', avatar: '🧑', role: 'member' },
];

const MOCK_PROJECTS = [
    { id: 'proj-1', name: 'Lanzamiento Web 2.0', status: 'Active', color: '#6366f1' },
    { id: 'proj-2', name: 'Campaña Marketing Q1', status: 'Planning', color: '#10b981' },
    { id: 'proj-3', name: 'Expansión Latam', status: 'Active', color: '#f59e0b' },
];

const INITIAL_TASKS = [
    {
        id: 'task-1',
        name: 'Revisar Presupuesto Q1',
        description: 'Analizar discrepancias en gastos de marketing',
        status: 'To Do',
        assigned_to: 'user-1',
        project_id: 'proj-2',
        due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        created_at: new Date(Date.now() - 172800000).toISOString(),
        action_type: 'analyze'
    },
    {
        id: 'task-2',
        name: 'Entrevistar candidato Senior Dev',
        description: 'Revisar portafolio antes de la llamada',
        status: 'To Do',
        assigned_to: 'user-1',
        project_id: 'proj-1',
        due_date: new Date(Date.now() + 172800000).toISOString(), // +2 days
        created_at: new Date(Date.now() - 86400000).toISOString(),
        action_type: 'meeting'
    },
    {
        id: 'task-3',
        name: 'Enviar reporte mensual a inversores',
        description: 'Incluir métricas de crecimiento y retención',
        status: 'To Do',
        assigned_to: 'user-2',
        project_id: 'proj-3',
        due_date: new Date(Date.now() + 345600000).toISOString(), // +4 days
        created_at: new Date(Date.now() - 259200000).toISOString(),
        action_type: 'delegate'
    },
];

const INITIAL_INBOX = [
    {
        id: 'inbox-1',
        content: 'Recordar pedir feedback a Laura sobre la presentación de ventas de ayer, necesito incorporarlo antes del lunes.',
        processed: false,
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        source: 'voice'
    },
    {
        id: 'inbox-2',
        content: 'Llamar a Proveedores Inc. para renegociar el contrato anual, decirles que tenemos una oferta mejor de la competencia y ver si pueden igualarla.',
        processed: false,
        created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        source: 'voice'
    },
    {
        id: 'inbox-3',
        content: 'Idea para el blog: 5 formas de usar nuestra herramienta para ahorrar tiempo. Redactar borrador para el viernes y pedirle a Carlos que haga los gráficos.',
        processed: false,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        source: 'voice'
    },
    {
        id: 'inbox-4',
        content: 'Confirmar asistencia al evento de networking del próximo martes y preparar tarjetas de visita.',
        processed: false,
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
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
            auto_processed: true,
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
