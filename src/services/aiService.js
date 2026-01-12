// AI Service - Connects to OpenAI API
// Using the API key from environment variables (local dev only)
// In production, uses Netlify function proxy to avoid CORS

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';
const PROXY_URL = '/api/openai'; // Netlify function proxy

// Detect if we're in production (Netlify)
const isProduction = import.meta.env.PROD;

// Helper function to call OpenAI
async function callOpenAI(messages, temperature = 0.7, jsonMode = false) {
    // In production, use the proxy to avoid CORS
    if (isProduction) {
        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    temperature,
                    jsonMode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to call AI service');
            }

            const data = await response.json();
            return data.content;
        } catch (error) {
            console.error('AI Service Error (Proxy):', error);
            throw error;
        }
    }

    // Local development: call OpenAI directly
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API Key is missing. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: messages,
                temperature: temperature,
                response_format: jsonMode ? { type: "json_object" } : { type: "text" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to call OpenAI API');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
}

// Generate tasks using OpenAI
export async function generateTasksFromAI(input, options = {}) {
    const { dueDate, projectId, users = [] } = options;

    // Prepare context for the AI
    const userContext = users.map(u => ({ id: u.id, name: u.name })).slice(0, 10); // Limit to avoid hitting token limits
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `
    You are an expert project manager. Break down the user's request into actionable project tasks.
    
    Current Date: ${today}
    Context:
    - Base Due Date: ${dueDate ? new Date(dueDate).toISOString().split('T')[0] : 'Not specified'}
    - Available Team Members: ${JSON.stringify(userContext)}
    
    Instructions:
    1. Analyze the request and break it down into logical steps/tasks.
    2. Assign a default 'daysOffset' (number of days from now) for each task to create a timeline.
    3. Suggest an assignee from the team members list if their name or role is implied, otherwise use null.
    4. Return ONLY valid JSON with this structure:
    {
      "tasks": [
        {
          "name": "Task Title",
          "description": "Brief description",
          "daysOffset": 0, // 0 for today, 1 for tomorrow, etc.
          "assignedTo": "user_id_or_null"
        }
      ]
    }
    `;

    try {
        const response = await callOpenAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: input }
        ], 0.7, true);

        const result = JSON.parse(response);

        // Post-process to format for our app
        const baseDate = new Date();

        return result.tasks.map(task => {
            const taskDueDate = new Date(baseDate);
            taskDueDate.setDate(baseDate.getDate() + (task.daysOffset || 0));

            let assignedTo = task.assignedTo || options.assignedTo || null;
            if (assignedTo === 'null' || assignedTo === 'undefined' || assignedTo === '') {
                assignedTo = null;
            }

            // Verify if the suggested ID exists in our user list to avoid foreign key violations
            if (assignedTo && !users.some(u => u.id === assignedTo)) {
                assignedTo = null;
            }

            return {
                name: task.name,
                description: task.description || `AI-generated task based on: "${input}"`,
                due_date: taskDueDate.toISOString(),
                assigned_to: assignedTo,
                project_id: projectId,
                created_by_ai: true,
                status: 'To Do'
            };
        });
    } catch (error) {
        console.error('Failed to generate tasks:', error);
        // Fallback or rethrow
        alert('Failed to generate tasks with AI: ' + error.message);
        return [];
    }
}

// Generate document content with OpenAI
export async function generateDocumentWithAI(title, prompt, options = {}) {
    const systemPrompt = `
    You are a professional technical writer and project manager. 
    Create a comprehensive document based on the user's prompt and title.
    
    Output Format: HTML (just the body content, no html/head tags).
    - Use <h2>, <h3> for headings.
    - Use <p> for paragraphs.
    - Use <ul>/<ol> and <li> for lists.
    - Use <strong> for emphasis.
    - Make it professional, detailed, and structured.
    `;

    const userPrompt = `
    Document Title: ${title}
    Brief/Topic: ${prompt}
    
    Please write the full content for this document.
    `;

    try {
        const content = await callOpenAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], 0.7, false);

        return content;
    } catch (error) {
        console.error('Failed to generate document:', error);
        // Return a basic fallback so the app doesn't crash
        return `
            <h2>Error Generating Content</h2>
            <p>We encountered an issue connecting to the AI service. Please try again.</p>
            <p>Error details: ${error.message}</p>
        `;
    }
}

// AI Today Summary
export async function getTodaySummary(projectId, tasks, currentUser) {
    // We can stick to local logic for this for speed, or use AI to make it witty.
    // Let's keep the logic local for now unless you want a purely AI summary.
    // However, if we want an "AI Coach" feeling, sending it to OpenAI is better.

    // Preparation
    const myTasks = projectId
        ? tasks.filter(t => t.project_id === projectId && t.assigned_to === currentUser.id)
        : tasks.filter(t => t.assigned_to === currentUser.id);

    // If no tasks, return simple message
    if (myTasks.length === 0) return projectId ? "You have no tasks assigned in this project." : "You have no tasks assigned in any project.";

    // Prepare data for AI
    const taskData = myTasks.map(t => ({
        name: t.name,
        status: t.status,
        dueDate: t.due_date
    }));

    const systemPrompt = `
    You are a helpful and energetic project assistant.
    Review the user's tasks and give a brief, motivating summary of what they should focus on today.
    Highlight overdue items first, then tasks due today.
    Keep it concise (max 3-4 sentences) and friendly.
    `;

    try {
        const response = await callOpenAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Here are my tasks: ${JSON.stringify(taskData)}` }
        ]);
        return response;
    } catch (error) {
        // Fallback to the old logic if API fails
        return getLocalSummary(projectId, tasks, currentUser);
    }
}

// Fallback local summary (original logic)
function getLocalSummary(projectId, tasks, currentUser) {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const myTasks = projectTasks.filter(t => t.assigned_to === currentUser.id);
    const overdue = myTasks.filter(t =>
        t.status !== 'Done' && new Date(t.due_date) < new Date()
    );
    const dueToday = myTasks.filter(t => {
        const dueDate = new Date(t.due_date).toDateString();
        return t.status !== 'Done' && dueDate === new Date().toDateString();
    });

    let summary = '';
    if (overdue.length > 0) summary += `⚠️ You have ${overdue.length} overdue tasks.\n`;
    if (dueToday.length > 0) summary += `📅 ${dueToday.length} tasks due today.\n`;
    if (!summary) summary = "✨ All caught up! No urgent tasks.";

    return summary;
}

// Transcribe audio using OpenAI Whisper with auto-language detection
export async function transcribeAudio(audioBlob) {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API Key is missing. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    // formData.append('language', 'en'); // Reverted: Allow auto-detection
    formData.append('response_format', 'verbose_json'); // Gets us language detection data

    try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to transcribe audio');
        }

        const data = await response.json();

        // Whisper returns detected language in ISO format (e.g., 'english', 'spanish')
        // Returning both text and language for better UI feedback
        return {
            text: data.text,
            language: data.language
        };
    } catch (error) {
        console.error('Transcription Error:', error);
        throw error;
    }
}
// AI Assistant Chat with full context
export async function askAiAssistant(userInput, context) {
    const { projects, tasks, currentUser } = context;

    // Build a compact summary of the workspace
    const projectsSummary = projects.map(p => ({
        name: p.name,
        taskCount: tasks.filter(t => t.project_id === p.id).length,
        doneTasks: tasks.filter(t => t.project_id === p.id && t.status === 'Done').length
    }));

    const pendingTasks = tasks
        .filter(t => t.status !== 'Done')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 20) // Slightly more context
        .map(t => ({
            name: t.name,
            project: projects.find(p => p.id === t.project_id)?.name || 'General / Unassigned',
            due: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date',
            assignee: t.assigned_to === currentUser.id ? 'Me (the User)' : 'Another team member'
        }));

    const systemPrompt = `
    You are professional AI Project Manager for the app "AI Project Hub".
    You have access to the user's workspace data.
    
    CurrentUser: ${currentUser.name} (${currentUser.role})
    
    Workspace Status:
    - Projects: ${JSON.stringify(projectsSummary)}
    - Pending Tasks (Next 15): ${JSON.stringify(pendingTasks)}
    
    Formatting Instructions:
    1. EXTREMELY IMPORTANT: Use Markdown for formatting.
    2. Use bold titles for tasks or projects (**Title**).
    3. Use bullet points for details.
    4. Group information logically (e.g., by Project or by Urgency).
    5. Use relevant emojis periodically to make the interface friendly (🚀, 📅, ⚠️, ✅).
    6. Keep sentences concise. Use shorter, punchier paragraphs.
    7. If listing tasks, format them like this:
       **Task Name** 🗓️ Jan 10
       • Project: [Project Name]
       • Status: [Status]
    
    Tone: Executive, supportive, and efficient.
    `;

    try {
        const response = await callOpenAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: userInput }
        ], 0.6);
        return response;
    } catch (error) {
        console.error('AI Assistant Error:', error);
        // Show specific configuration errors
        if (error.message.includes('API Key') || error.message.includes('missing')) {
            return `⚠️ **Configuration Error**: ${error.message}\n\nPlease check your cloud provider settings.`;
        }
        return "I'm sorry, I'm having trouble connecting to my central brain. Please check your connection or try again later.";
    }
}

// AI-Guided Project Setup with PMBOK & Agile knowledge
export async function guidedProjectSetup(userInput, conversationHistory = [], currentStep = 'intro', language = 'en') {
    const isSpanish = language.startsWith('es');

    const systemPrompt = `
    You are an expert AI Project Manager with deep knowledge of PMBOK 7th Edition, Agile (Scrum/Kanban), and Risk Management.
    
    **LANGUAGE INSTRUCTION**: 
    - The user's preferred language is: ${isSpanish ? 'SPANISH (Español)' : 'ENGLISH'}.
    - YOU MUST respond in ${isSpanish ? 'Spanish' : 'English'}.
    - If the user switches language, switch with them.
    
    Your role is to guide users through setting up a new project by asking key questions CRUCIAL for success.
    
    **Current Step: ${currentStep}**
    
    Follow this conversation flow:
    
    1. **INTRO** (if no history): Warmly greet the user. Ask what problem/opportunity they are trying to address (PMBOK: Business Case).
       ${isSpanish ? '(Hola, soy tu PM con IA. ¿Qué proyecto quieres crear hoy?)' : ''}
    
    2. **STAKEHOLDERS**: Ask who the key stakeholders are (PMBOK: Stakeholder Engagement).
    
    3. **SUCCESS_CRITERIA**: Ask what "done" looks like (Agile: Definition of Done).
    
    4. **TIMELINE**: Ask about target deadline (PMBOK: Schedule Management).
    
    5. **RISKS**: Ask what worries them most (PMBOK: Risk Management).
    
    6. **METHODOLOGY**: Recommend Agile, Waterfall, or Hybrid.
    
    7. **SUMMARY**: Generate a structured project summary (JSON).
    
    **Formatting Guidelines:**
    - Use Markdown.
    - Keep messages conversational but professional.
    - One question at a time.
    - Use emojis sparingly.
    
    **JSON Summary Format (only for final step):**
    \`\`\`json
    {
        "projectName": "...",
        "description": "...",
        "problemStatement": "...",
        "successCriteria": ["...", "..."],
        "stakeholders": ["...", "..."],
        "timeline": "...",
        "risks": ["...", "...", "..."],
        "methodology": "Agile|Waterfall|Hybrid",
        "suggestedTasks": [
            {"name": "...", "description": "..."},
            ...
        ]
    }
    \`\`\`
    `;

    const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userInput }
    ];

    try {
        const response = await callOpenAI(messages, 0.7, false);
        return response;
    } catch (error) {
        console.error('Guided Setup Error:', error);
        if (error.message.includes('API Key') || error.message.includes('missing')) {
            throw error;
        }
        return "I'm having trouble connecting right now. Please try again in a moment.";
    }
}

// Parse the AI's summary response to extract project data
export function parseProjectSummary(aiResponse) {
    try {
        // Extract JSON from markdown code blocks
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]);
        }
        return null;
    } catch (error) {
        console.error('Error parsing project summary:', error);
        return null;
    }
}

// ============================================
// VOICE-FIRST PM COMMAND CENTER FUNCTIONS
// ============================================

/**
 * Classify voice content to determine its type and suggested action.
 * This runs before task extraction to intelligently route content.
 * @param {string} transcription - The voice transcription text
 * @param {Object} context - Context with language preference
 * @returns {Object} - { contentType, confidence, intent, suggestedAction, summary }
 */
export async function classifyVoiceContent(transcription, context = {}) {
    const { language = 'en' } = context;
    const isSpanish = language.startsWith('es');

    const systemPrompt = `
    You are a content classifier for voice recordings in a PM app.
    Analyze this transcription and classify it into one of the following types:
    
    CONTENT TYPES:
    - project: Exclusively used to create a new project (e.g., "Create a new project for the branding campaign")
    - task: Contains actionable commitment with clear action (e.g., "Juan needs to finish the report by Friday")
    - note: General information, observation, or status update (e.g., "The client liked the new design")
    - question: Asking for information (e.g., "What's the status of the API integration?")
    - idea: Suggestion or brainstorm (e.g., "We could add a dark mode feature")
    - meeting_summary: Summary or recap of a discussion
    - unclear: Cannot determine type confidently
    
    SUGGESTED ACTIONS:
    - extract_tasks: Content contains clear tasks OR is a project creation intent (so we can extract the project name) → run task extraction
    - save_to_inbox: Content is informational → save directly to inbox
    - ask_clarification: Content is unclear → ask user for more info
    
    LANGUAGE: Respond in ${isSpanish ? 'Spanish' : 'English'} for intent/summary fields.
    
    Return ONLY valid JSON:
    {
        "contentType": "project|task|note|question|idea|meeting_summary|unclear",
        "confidence": 0.95,
        "intent": "Brief description of what user wants to accomplish",
        "suggestedAction": "extract_tasks|save_to_inbox|ask_clarification",
        "summary": "One-sentence summary of the content"
    }
    
    EXAMPLES:
    
    Input: "Juan debe terminar el reporte para el viernes"
    Output: {
        "contentType": "task",
        "confidence": 0.95,
        "intent": "Crear tarea para Juan",
        "suggestedAction": "extract_tasks",
        "summary": "Juan debe terminar el reporte para el viernes"
    }
    
    Input: "El cliente aprobó el diseño de la landing page"
    Output: {
        "contentType": "note",
        "confidence": 0.9,
        "intent": "Registrar aprobación del cliente",
        "suggestedAction": "save_to_inbox",
        "summary": "Cliente aprobó diseño de landing page"
    }
    
     Input: "Crear un nuevo proyecto llamado Plan Alfa"
    Output: {
        "contentType": "project",
        "confidence": 0.98,
        "intent": "Crear nuevo proyecto Plan Alfa",
        "suggestedAction": "extract_tasks",
        "summary": "Crear el proyecto Plan Alfa"
    }
    
    Input: "mm, no sé, algo sobre"
    Output: {
        "contentType": "unclear",
        "confidence": 0.3,
        "intent": "Contenido poco claro",
        "suggestedAction": "ask_clarification",
        "summary": "Grabación poco clara"
    }
    `;

    try {
        console.log('[Voice Capture] Classifying transcription:', transcription);
        const response = await callOpenAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Transcription: "${transcription}"` }
        ], 0.2, true); // Low temperature for consistent classification

        console.log('[Voice Capture] Classification:', response);
        const result = JSON.parse(response);

        // Validate confidence threshold
        if (result.confidence < 0.5) {
            result.suggestedAction = 'ask_clarification';
        }

        return result;
    } catch (error) {
        console.error('Content classification error:', error);
        // Fallback: assume it's a task and let task extraction handle it
        return {
            contentType: 'unclear',
            confidence: 0.3,
            intent: isSpanish ? 'Error al clasificar' : 'Classification error',
            suggestedAction: 'save_to_inbox', // Safe fallback
            summary: transcription.substring(0, 100),
            error: error.message
        };
    }
}

/**
 * Extract tasks from voice transcription.
 * Identifies task descriptions, owners, and due dates from natural speech.
 * @param {string} transcription - The voice transcription text
 * @param {Object} context - Context with users and projects
 * @returns {Object} - { tasks: Task[], needsFollowUp: boolean, followUpQuestion: string|null }
 */
export async function extractTasksFromVoice(transcription, context = {}) {
    const { users = [], projects = [], language = 'en' } = context;
    const isSpanish = language.startsWith('es');
    const today = new Date().toISOString().split('T')[0];

    // Build project context for AI
    const projectContext = projects.map(p => ({ id: p.id, name: p.name })).slice(0, 20);
    const userContext = users.map(u => ({ id: u.id, name: u.name })).slice(0, 15);

    const systemPrompt = `
    You are an expert task extraction assistant for a Voice-First PM system.
    Your job is to listen to spoken commitments and extract structured tasks.
    
    LANGUAGE: Respond in ${isSpanish ? 'Spanish' : 'English'}.
    Current Date: ${today}
    
    Available Team Members:
    ${JSON.stringify(userContext, null, 2)}

    Available Projects:
    ${JSON.stringify(projectContext, null, 2)}
    
    INSTRUCTIONS:
    1. Analyze the transcription for any tasks, action items, or commitments.
    2. For each task found, extract:
       - name: Clear, actionable task title
       - description: Brief context (if any)
       - actionType: "todo" | "delegate" | "discuss" | "buy" | "read"
       - assignedTo: Match to a team member ID from the list above (or null if unspecified)
       - projectId: Match to a project ID from the list above if explicitly mentioned or contextually obvious (or null)
       - suggestedProjectName: If a new project (context) is mentioned (e.g., "for Marketing"), name it.
       - dueDate: Parse relative dates ("next Tuesday", "tomorrow", "in 3 days") to ISO format
       - confidence: 0-1 score of extraction confidence
    
    3. If a task is mentioned but missing critical info (owner or date), set needsFollowUp = true.
    
    4. Action Type Guidelines:
       - "delegate": Explicitly assigning to someone else ("Tell Juan to...")
       - "discuss": Needs a conversation ("Ask Maria about...", "Discuss budget with Alex")
       - "buy": Purchasing ("Buy milk", "Order software")
       - "read": Reading/Reviewing ("Read report", "Review proposal")
       - "todo": General personal tasks
    
    5. For date parsing examples:
       - "next Tuesday" → calculate from ${today}
       - "tomorrow" → next day from ${today}
       - "next week" → 7 days from ${today}
       - "for Friday" → next Friday from ${today}
    
    6. For assignee matching, be flexible with names:
       - "Maria" matches "Maria Garcia"
       - "Juan" matches "Juan Rodriguez"
       - Use fuzzy matching on first names

    6. For project matching:
       - "in the website project" → match to project with name "Website Redesign"
       - "create a new project called X" → projectId: null, suggestedProjectName: "X"
    
    Return ONLY valid JSON:
    {
        "tasks": [
            {
                "name": "Task title",
                "description": "Context if any",
                "assignedTo": "user_id_or_null",
                "assignedToName": "Matched user name or null",
                "projectId": "project_id_or_null",
                "suggestedProjectName": "Name for new project or null",
                "dueDate": "ISO date or null",
                "dueDateParsed": "Human readable date",
                "confidence": 0.9
            }
        ],
        "needsFollowUp": false,
        "followUpQuestion": null,
        "rawParsedIntents": ["list", "of", "detected", "intents"]
    }
    
    If no tasks are found, return:
    {
        "tasks": [],
        "needsFollowUp": false,
        "followUpQuestion": null,
        "note": "Reason why no tasks were extracted"
    }
    `;

    try {
        const response = await callOpenAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Voice transcription: "${transcription}"` }
        ], 0.3, true);

        const result = JSON.parse(response);

        // Post-process: validate user IDs exist and DETECT UNKNOWN USERS
        if (result.tasks && result.tasks.length > 0) {
            result.tasks = result.tasks.map(task => {
                // Verify assignee exists in user list
                if (task.assignedTo && !users.some(u => u.id === task.assignedTo)) {
                    // ID returned but not in our list? Trust the ID less, or keep it null.
                    task.assignedTo = null;
                    // BUT keep assignedToName if it was extracted!
                }
                return task;
            });

            // check for unknown users to trigger interactiveness
            const taskWithUnknownUser = result.tasks.find(t => !t.assignedTo && t.assignedToName && t.assignedToName.toLowerCase() !== 'me' && t.assignedToName.toLowerCase() !== 'moi' && t.assignedToName.toLowerCase() !== 'yo');

            if (taskWithUnknownUser) {
                result.needsFollowUp = true;
                const unknownName = taskWithUnknownUser.assignedToName;
                result.followUpQuestion = isSpanish
                    ? `No tengo a "${unknownName}" en tu equipo. ¿Quieres que cree un perfil para esta persona?`
                    : `I don't have "${unknownName}" in your team. Do you want me to create a profile for them?`;
            }
        }

        return result;
    } catch (error) {
        console.error('Voice task extraction error:', error);
        return {
            tasks: [],
            needsFollowUp: true,
            followUpQuestion: isSpanish
                ? "No pude entender la tarea. ¿Podrías repetirla más claramente?"
                : "I couldn't parse that task. Could you repeat it more clearly?",
            error: error.message
        };
    }
}

// ... (extractTasksFromVoice implementation)

/**
 * Analyze a single inbox item to suggest smart processing fields.
 * Wraps extractTasksFromVoice but returns a single structured suggestion.
 * @param {string} text - The content to analyze
 * @param {Object} context - Full user/project context
 * @returns {Object} - { actionType, assigned_to, project_id, due_date, name }
 */
export async function analyzeInboxAction(text, context) {
    // Reuse the robust extraction logic
    const result = await extractTasksFromVoice(text, context);

    if (result.tasks && result.tasks.length > 0) {
        const task = result.tasks[0]; // Take the first/primary task detected

        // Map extraction result to our internal fields
        return {
            name: task.name,
            action_type: task.actionType || 'todo',
            assigned_to: task.assignedTo,
            project_id: task.projectId,
            due_date: task.dueDate
        };
    }

    // Fallback if no specific task structure detected
    return {
        name: text,
        action_type: 'todo',
        assigned_to: null,
        project_id: null,
        due_date: null
    };
}
/**
 * Generate a follow-up question when task info is incomplete.
 * @param {Object} partialTask - The partial task data
 * @param {string} missingField - 'assignee' | 'dueDate' | 'both'
 * @param {string} language - 'en' | 'es'
 * @returns {string} - The follow-up question
 */
export function generateFollowUpQuestion(partialTask, missingField, language = 'en') {
    const isSpanish = language.startsWith('es');
    const taskName = partialTask.name || (isSpanish ? 'esa tarea' : 'that task');

    const questions = {
        assignee: {
            en: `Got it! Who should "${taskName}" be assigned to?`,
            es: `¡Entendido! ¿A quién debo asignar "${taskName}"?`
        },
        dueDate: {
            en: `When is "${taskName}" due?`,
            es: `¿Para cuándo es "${taskName}"?`
        },
        both: {
            en: `For "${taskName}" - who should do it and when is it due?`,
            es: `Para "${taskName}" - ¿quién lo hará y para cuándo?`
        }
    };

    return questions[missingField]?.[isSpanish ? 'es' : 'en'] || questions.both[isSpanish ? 'es' : 'en'];
}

/**
 * Enhanced AI Assistant specifically for accountability queries.
 * Optimized for questions like "What does X owe?" or "What's overdue?"
 * @param {string} userInput - The user's question
 * @param {Object} context - Full context with projects, tasks, users
 * @returns {string} - Formatted response
 */
export async function askAccountabilityQuery(userInput, context) {
    const { projects, tasks, users, currentUser, language = 'en' } = context;
    const isSpanish = language.startsWith('es');
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Categorize tasks for quick reference
    const overdueTasks = tasks.filter(t =>
        t.status !== 'Done' && t.due_date && new Date(t.due_date) < today
    );

    const thisWeekTasks = tasks.filter(t => {
        if (t.status === 'Done' || !t.due_date) return false;
        const due = new Date(t.due_date);
        return due >= today && due <= nextWeek;
    });

    const pendingByUser = {};
    users.forEach(user => {
        pendingByUser[user.name] = tasks.filter(t =>
            t.assigned_to === user.id && t.status !== 'Done'
        );
    });

    // Build compact context for the AI
    const contextSummary = {
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status !== 'Done').length,
        overdueTasks: overdueTasks.length,
        dueThisWeek: thisWeekTasks.length,
        teamMembers: users.map(u => ({
            name: u.name,
            pendingCount: pendingByUser[u.name]?.length || 0,
            overdue: pendingByUser[u.name]?.filter(t => t.due_date && new Date(t.due_date) < today).length || 0
        })),
        projects: projects.map(p => ({
            name: p.name,
            taskCount: tasks.filter(t => t.project_id === p.id).length
        }))
    };

    // Detailed task lists for specific queries
    const taskDetails = {
        overdue: overdueTasks.slice(0, 15).map(t => ({
            name: t.name,
            project: projects.find(p => p.id === t.project_id)?.name || 'No Project',
            assignee: users.find(u => u.id === t.assigned_to)?.name || 'Unassigned',
            dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date'
        })),
        thisWeek: thisWeekTasks.slice(0, 15).map(t => ({
            name: t.name,
            project: projects.find(p => p.id === t.project_id)?.name || 'No Project',
            assignee: users.find(u => u.id === t.assigned_to)?.name || 'Unassigned',
            dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date'
        })),
        byUser: Object.fromEntries(
            Object.entries(pendingByUser).map(([name, userTasks]) => [
                name,
                userTasks.slice(0, 10).map(t => ({
                    name: t.name,
                    project: projects.find(p => p.id === t.project_id)?.name || 'No Project',
                    dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date',
                    status: t.status
                }))
            ])
        )
    };

    const systemPrompt = `
    You are the AI Command Center for a Voice-First PM system.
    Your specialty is ACCOUNTABILITY TRACKING - answering questions about who owes what.
    
    LANGUAGE: ${isSpanish ? 'SPANISH (respond in Spanish)' : 'ENGLISH'}
    Current User: ${currentUser?.name || 'Unknown'}
    Today: ${today.toLocaleDateString()}
    
    WORKSPACE STATUS:
    ${JSON.stringify(contextSummary, null, 2)}
    
    DETAILED TASK DATA:
    ${JSON.stringify(taskDetails, null, 2)}
    
    COMMON QUERY PATTERNS:
    1. "What does [Name] owe?" → List their pending tasks with due dates
    2. "What's overdue?" → List all overdue tasks with owners
    3. "What's due this week?" → List upcoming tasks
    4. "Who owes what?" → Summary by person
    5. "Status of [Project]" → Project-specific breakdown
    
    RESPONSE GUIDELINES:
    1. Be DIRECT and ACTIONABLE - executives want quick answers
    2. Use Markdown formatting:
       - **Bold** for task names
       - Bullet points for lists
       - 📅 for due dates, ⚠️ for overdue, ✅ for done
       - Group by person or project as appropriate
    3. Highlight overdue items first
    4. Keep responses concise but complete
    5. If someone has no pending tasks, say so clearly
    6. Use the person's first name for familiarity
    
    Example response format:
    **Maria has 3 pending tasks:**
    
    ⚠️ **Budget Report** 📅 Jan 8 (overdue!)
    • Project: Q1 Planning
    
    **Client Proposal** 📅 Jan 15
    • Project: Sales Initiative
    `;

    try {
        const response = await callOpenAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: userInput }
        ], 0.5);
        return response;
    } catch (error) {
        console.error('Accountability query error:', error);
        return isSpanish
            ? "Lo siento, hubo un error al consultar. Intenta de nuevo."
            : "Sorry, there was an error processing your query. Please try again.";
    }
}

/**
 * Get quick accountability stats for the Command Center dashboard
 * @param {Object} context - Context with tasks, users
 * @returns {Object} - Quick stats object
 */
export function getAccountabilityStats(tasks, users) {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const pending = tasks.filter(t => t.status !== 'Done');
    const overdue = pending.filter(t => t.due_date && new Date(t.due_date) < today);
    const dueThisWeek = pending.filter(t => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        return due >= today && due <= nextWeek;
    });
    const unassigned = pending.filter(t => !t.assigned_to);
    const voiceCreated = tasks.filter(t => t.source === 'voice');

    // Top 3 people with most pending tasks
    const byPerson = {};
    users.forEach(u => {
        byPerson[u.id] = {
            name: u.name,
            count: pending.filter(t => t.assigned_to === u.id).length
        };
    });
    const topOwners = Object.values(byPerson)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    return {
        totalPending: pending.length,
        overdue: overdue.length,
        dueThisWeek: dueThisWeek.length,
        unassigned: unassigned.length,
        voiceCreated: voiceCreated.length,
        topOwners
    };
}
