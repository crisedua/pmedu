// AI Service - Connects to OpenAI API
// Using the API key from environment variables

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

// Helper function to call OpenAI
async function callOpenAI(messages, temperature = 0.7, jsonMode = false) {
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
                model: "gpt-4o-mini", // Fast and efficient model
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

            return {
                name: task.name,
                description: task.description || `AI-generated task based on: "${input}"`,
                dueDate: taskDueDate.toISOString(),
                assignedTo: task.assignedTo || options.assignedTo || null,
                project_id: projectId, // Ensure snake_case
                created_by_ai: true,   // Ensure snake_case
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
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const myTasks = projectTasks.filter(t => t.assigned_to === currentUser.id);

    // If no tasks, return simple message
    if (myTasks.length === 0) return "You have no tasks assigned in this project. Ask the project manager for work!";

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
// Utility functions (Removed duplicate AI code)

