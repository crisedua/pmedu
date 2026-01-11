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
export async function guidedProjectSetup(userInput, conversationHistory = [], currentStep = 'intro') {
    const systemPrompt = `
    You are an expert AI Project Manager with deep knowledge of:
    - PMBOK 7th Edition (Project Management Body of Knowledge)
    - Agile methodologies (Scrum, Kanban, SAFe)
    - Lean principles
    - Risk management best practices
    
    Your role is to guide users through setting up a new project by asking key questions that are CRUCIAL for project success.
    
    **Current Step: ${currentStep}**
    
    Follow this conversation flow:
    
    1. **INTRO** (if no history): Warmly greet the user. Ask what problem/opportunity they are trying to address (PMBOK: Business Case).
    
    2. **STAKEHOLDERS**: Ask who the key stakeholders are and who will be impacted (PMBOK: Stakeholder Engagement).
    
    3. **SUCCESS_CRITERIA**: Ask what "done" looks like - how will they measure success? (Agile: Definition of Done, PMBOK: Quality Management).
    
    4. **TIMELINE**: Ask about target deadline or timeframe (PMBOK: Schedule Management).
    
    5. **RISKS**: Ask what could go wrong and what worries them most (PMBOK: Risk Management).
    
    6. **METHODOLOGY**: Based on answers, recommend Agile, Waterfall, or Hybrid. Ask if they agree.
    
    7. **SUMMARY**: Generate a structured project summary with:
       - Project Name (suggest one based on context)
       - Problem Statement
       - Success Criteria
       - Key Stakeholders
       - Timeline
       - Top 3 Risks
       - Recommended Methodology
       - Suggested First Tasks (3-5 tasks)
    
    **Formatting Guidelines:**
    - Use Markdown formatting
    - Keep messages conversational but professional
    - One question at a time (except summary)
    - Use emojis sparingly for warmth (📋, 🎯, ⚠️, ✅)
    - When generating the SUMMARY, use JSON format wrapped in \`\`\`json code blocks
    
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
