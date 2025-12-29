// AI Service - Simulates AI task and document generation
// In production, this would connect to OpenAI, Claude, or another AI API

// Simulate AI processing delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse natural language task input
export async function generateTasksFromAI(input, options = {}) {
    const { dueDate, assignedTo, projectId, users = [] } = options;

    await delay(1500); // Simulate AI thinking

    // Simple NLP-like parsing for demo purposes
    const inputLower = input.toLowerCase();
    const words = input.split(' ');

    // Extract potential assignees from input
    const mentionedUsers = users.filter(user =>
        inputLower.includes(user.name.toLowerCase()) ||
        inputLower.includes(user.name.split(' ')[0].toLowerCase())
    );

    // Extract potential dates
    const dateKeywords = {
        'today': 0,
        'tomorrow': 1,
        'monday': getNextDayOfWeek(1),
        'tuesday': getNextDayOfWeek(2),
        'wednesday': getNextDayOfWeek(3),
        'thursday': getNextDayOfWeek(4),
        'friday': getNextDayOfWeek(5),
        'saturday': getNextDayOfWeek(6),
        'sunday': getNextDayOfWeek(0),
        'next week': 7,
    };

    let baseDueDate = dueDate ? new Date(dueDate) : new Date();
    for (const [keyword, days] of Object.entries(dateKeywords)) {
        if (inputLower.includes(keyword)) {
            baseDueDate = addDays(new Date(), typeof days === 'number' ? days : days);
            break;
        }
    }

    // Generate tasks based on input analysis
    const tasks = analyzeAndGenerateTasks(input, {
        baseDueDate,
        defaultAssignee: assignedTo,
        mentionedUsers,
        projectId,
        users,
    });

    return tasks;
}

function analyzeAndGenerateTasks(input, options) {
    const { baseDueDate, defaultAssignee, mentionedUsers, projectId, users } = options;
    const inputLower = input.toLowerCase();

    // Common task patterns
    const taskPatterns = [
        // Launch related
        {
            keywords: ['launch', 'release', 'deploy', 'go live'],
            tasks: [
                { name: 'Prepare pre-launch checklist', daysOffset: -3 },
                { name: 'Final quality assurance review', daysOffset: -2 },
                { name: 'Prepare launch announcement', daysOffset: -1 },
                { name: 'Deploy to production', daysOffset: 0 },
                { name: 'Monitor post-launch metrics', daysOffset: 1 },
            ],
        },
        // Landing page
        {
            keywords: ['landing page', 'landing', 'homepage', 'website'],
            tasks: [
                { name: 'Write landing page copy', daysOffset: -4 },
                { name: 'Design landing page mockups', daysOffset: -3 },
                { name: 'Develop landing page components', daysOffset: -2 },
                { name: 'Add images and media assets', daysOffset: -1 },
                { name: 'Test responsiveness and browser compatibility', daysOffset: 0 },
            ],
        },
        // Marketing campaign
        {
            keywords: ['marketing', 'campaign', 'promotion', 'ads'],
            tasks: [
                { name: 'Define campaign objectives and KPIs', daysOffset: -5 },
                { name: 'Create campaign content calendar', daysOffset: -4 },
                { name: 'Design marketing visuals', daysOffset: -3 },
                { name: 'Set up ad campaigns', daysOffset: -2 },
                { name: 'Launch and monitor campaign performance', daysOffset: 0 },
            ],
        },
        // Meeting / Presentation
        {
            keywords: ['meeting', 'presentation', 'pitch', 'demo'],
            tasks: [
                { name: 'Prepare presentation outline', daysOffset: -3 },
                { name: 'Create presentation slides', daysOffset: -2 },
                { name: 'Practice presentation', daysOffset: -1 },
                { name: 'Conduct meeting/presentation', daysOffset: 0 },
                { name: 'Send follow-up notes and action items', daysOffset: 1 },
            ],
        },
        // Feature / Development
        {
            keywords: ['feature', 'develop', 'build', 'implement', 'create', 'add'],
            tasks: [
                { name: 'Define requirements and specifications', daysOffset: -4 },
                { name: 'Create technical design document', daysOffset: -3 },
                { name: 'Implement core functionality', daysOffset: -2 },
                { name: 'Write unit tests', daysOffset: -1 },
                { name: 'Code review and refinements', daysOffset: 0 },
            ],
        },
        // Report / Analysis
        {
            keywords: ['report', 'analysis', 'research', 'study', 'review'],
            tasks: [
                { name: 'Gather data and resources', daysOffset: -3 },
                { name: 'Analyze findings', daysOffset: -2 },
                { name: 'Draft report document', daysOffset: -1 },
                { name: 'Review and finalize report', daysOffset: 0 },
                { name: 'Present findings to stakeholders', daysOffset: 1 },
            ],
        },
    ];

    // Find matching pattern
    let matchedPattern = null;
    for (const pattern of taskPatterns) {
        if (pattern.keywords.some(keyword => inputLower.includes(keyword))) {
            matchedPattern = pattern;
            break;
        }
    }

    // Default pattern if no match
    if (!matchedPattern) {
        matchedPattern = {
            tasks: [
                { name: `Research: ${truncate(input, 40)}`, daysOffset: -2 },
                { name: `Plan: ${truncate(input, 40)}`, daysOffset: -1 },
                { name: `Execute: ${truncate(input, 40)}`, daysOffset: 0 },
                { name: `Review and complete: ${truncate(input, 40)}`, daysOffset: 1 },
            ],
        };
    }

    // Generate tasks with assignments
    return matchedPattern.tasks.map((task, index) => {
        let assignee = defaultAssignee;

        // Distribute among mentioned users if available
        if (mentionedUsers.length > 0) {
            assignee = mentionedUsers[index % mentionedUsers.length].id;
        }

        const taskDueDate = addDays(baseDueDate, task.daysOffset);

        return {
            name: task.name,
            description: `AI-generated task based on: "${truncate(input, 100)}"`,
            dueDate: taskDueDate.toISOString(),
            assignedTo: assignee || null,
            projectId,
            createdByAI: true,
        };
    });
}

// Generate document content with AI
export async function generateDocumentWithAI(title, prompt, options = {}) {
    await delay(2000); // Simulate AI thinking

    const promptLower = prompt.toLowerCase();

    // Document templates based on type
    const templates = {
        brief: {
            keywords: ['brief', 'overview', 'summary', 'intro'],
            content: generateBriefContent(title, prompt),
        },
        proposal: {
            keywords: ['proposal', 'offer', 'quote', 'bid'],
            content: generateProposalContent(title, prompt),
        },
        technical: {
            keywords: ['technical', 'spec', 'architecture', 'design doc'],
            content: generateTechnicalContent(title, prompt),
        },
        plan: {
            keywords: ['plan', 'strategy', 'roadmap', 'timeline'],
            content: generatePlanContent(title, prompt),
        },
        meeting: {
            keywords: ['meeting', 'notes', 'agenda', 'minutes'],
            content: generateMeetingContent(title, prompt),
        },
    };

    // Find matching template
    for (const [, template] of Object.entries(templates)) {
        if (template.keywords.some(keyword => promptLower.includes(keyword))) {
            return template.content;
        }
    }

    // Default generic document
    return generateGenericContent(title, prompt);
}

function generateBriefContent(title, prompt) {
    return `
<h1>${title}</h1>

<h2>Overview</h2>
<p>This document provides a comprehensive overview and brief for the initiative: <strong>${prompt}</strong></p>

<h2>Objectives</h2>
<ul>
<li>Define clear goals and success metrics</li>
<li>Establish scope and deliverables</li>
<li>Identify key stakeholders and their roles</li>
<li>Set realistic timelines and milestones</li>
</ul>

<h2>Background</h2>
<p>Understanding the context and motivation behind this initiative is crucial for its success. This section outlines the key factors that have led to this project.</p>

<h2>Scope</h2>
<p>The scope of this project includes:</p>
<ul>
<li>Primary deliverables and outputs</li>
<li>Key features and functionality</li>
<li>Integration requirements</li>
</ul>

<h2>Success Criteria</h2>
<p>The project will be considered successful when:</p>
<ul>
<li>All primary objectives are met</li>
<li>Quality standards are maintained</li>
<li>Stakeholder satisfaction is achieved</li>
</ul>

<h2>Next Steps</h2>
<ol>
<li>Review and approve this brief</li>
<li>Assign team members to key roles</li>
<li>Create detailed project plan</li>
<li>Kick off the project</li>
</ol>
  `.trim();
}

function generateProposalContent(title, prompt) {
    return `
<h1>${title}</h1>

<h2>Executive Summary</h2>
<p>This proposal outlines our approach to deliver exceptional results for: <strong>${prompt}</strong></p>

<h2>Problem Statement</h2>
<p>We understand the challenges you're facing and have designed a solution that directly addresses your needs while providing additional value.</p>

<h2>Proposed Solution</h2>
<p>Our comprehensive solution includes:</p>
<ul>
<li>Strategic planning and analysis</li>
<li>Implementation and execution</li>
<li>Quality assurance and testing</li>
<li>Training and documentation</li>
<li>Ongoing support and maintenance</li>
</ul>

<h2>Deliverables</h2>
<ol>
<li>Complete solution implementation</li>
<li>Documentation and training materials</li>
<li>Progress reports and updates</li>
<li>Final review and handoff</li>
</ol>

<h2>Timeline</h2>
<p>We propose a phased approach:</p>
<ul>
<li><strong>Phase 1:</strong> Discovery and Planning (Week 1-2)</li>
<li><strong>Phase 2:</strong> Development and Implementation (Week 3-6)</li>
<li><strong>Phase 3:</strong> Testing and Refinement (Week 7-8)</li>
<li><strong>Phase 4:</strong> Launch and Support (Week 9+)</li>
</ul>

<h2>Investment</h2>
<p>Detailed pricing and payment terms will be provided upon request.</p>

<h2>Why Choose Us</h2>
<ul>
<li>Proven track record of success</li>
<li>Expert team with diverse skills</li>
<li>Client-focused approach</li>
<li>Commitment to quality and deadlines</li>
</ul>
  `.trim();
}

function generateTechnicalContent(title, prompt) {
    return `
<h1>${title}</h1>

<h2>Technical Specification</h2>
<p>This document outlines the technical architecture and specifications for: <strong>${prompt}</strong></p>

<h2>System Architecture</h2>
<p>The system is designed with the following architectural principles:</p>
<ul>
<li>Scalability and performance optimization</li>
<li>Security and data protection</li>
<li>Maintainability and code quality</li>
<li>Integration capabilities</li>
</ul>

<h2>Technology Stack</h2>
<p>Recommended technologies:</p>
<ul>
<li><strong>Frontend:</strong> Modern JavaScript framework</li>
<li><strong>Backend:</strong> RESTful API architecture</li>
<li><strong>Database:</strong> Relational or NoSQL based on requirements</li>
<li><strong>Infrastructure:</strong> Cloud-native deployment</li>
</ul>

<h2>Data Model</h2>
<p>Core entities and their relationships will be defined based on business requirements.</p>

<h2>API Specifications</h2>
<p>The API will follow RESTful conventions with:</p>
<ul>
<li>Consistent endpoint naming</li>
<li>Standard HTTP methods</li>
<li>JSON request/response format</li>
<li>Proper error handling</li>
</ul>

<h2>Security Considerations</h2>
<ul>
<li>Authentication and authorization</li>
<li>Data encryption at rest and in transit</li>
<li>Input validation and sanitization</li>
<li>Regular security audits</li>
</ul>

<h2>Testing Strategy</h2>
<ul>
<li>Unit testing for individual components</li>
<li>Integration testing for system interactions</li>
<li>End-to-end testing for user flows</li>
<li>Performance testing for scalability</li>
</ul>
  `.trim();
}

function generatePlanContent(title, prompt) {
    return `
<h1>${title}</h1>

<h2>Strategic Plan</h2>
<p>This document outlines the strategic plan for: <strong>${prompt}</strong></p>

<h2>Vision</h2>
<p>Our vision is to achieve excellence through focused execution and continuous improvement.</p>

<h2>Goals & Objectives</h2>
<ol>
<li>Define clear, measurable objectives</li>
<li>Establish key performance indicators</li>
<li>Create accountability structures</li>
<li>Enable continuous progress tracking</li>
</ol>

<h2>Roadmap</h2>
<h3>Phase 1: Foundation (Month 1)</h3>
<ul>
<li>Setup and configuration</li>
<li>Team alignment</li>
<li>Initial planning</li>
</ul>

<h3>Phase 2: Development (Month 2-3)</h3>
<ul>
<li>Core implementation</li>
<li>Feature development</li>
<li>Testing and validation</li>
</ul>

<h3>Phase 3: Launch (Month 4)</h3>
<ul>
<li>Final preparations</li>
<li>Deployment</li>
<li>Monitoring and optimization</li>
</ul>

<h2>Resource Allocation</h2>
<p>Resources will be allocated based on priority and availability.</p>

<h2>Risk Management</h2>
<p>Identified risks and mitigation strategies will be documented and monitored.</p>

<h2>Success Metrics</h2>
<ul>
<li>On-time delivery</li>
<li>Quality standards met</li>
<li>Stakeholder satisfaction</li>
<li>Budget adherence</li>
</ul>
  `.trim();
}

function generateMeetingContent(title, prompt) {
    const today = new Date().toLocaleDateString();
    return `
<h1>${title}</h1>

<p><strong>Date:</strong> ${today}</p>
<p><strong>Topic:</strong> ${prompt}</p>

<h2>Attendees</h2>
<ul>
<li>[Add attendee names]</li>
</ul>

<h2>Agenda</h2>
<ol>
<li>Welcome and introductions (5 min)</li>
<li>Review of previous action items (10 min)</li>
<li>Main discussion: ${prompt} (30 min)</li>
<li>Action items and next steps (10 min)</li>
<li>Q&A and closing (5 min)</li>
</ol>

<h2>Discussion Notes</h2>
<p>[Add notes during the meeting]</p>

<h2>Key Decisions</h2>
<ul>
<li>[Add decisions made]</li>
</ul>

<h2>Action Items</h2>
<table>
<tr><th>Action</th><th>Owner</th><th>Due Date</th></tr>
<tr><td>[Action item]</td><td>[Name]</td><td>[Date]</td></tr>
</table>

<h2>Next Meeting</h2>
<p>Date: [TBD]</p>
<p>Location: [TBD]</p>
  `.trim();
}

function generateGenericContent(title, prompt) {
    return `
<h1>${title}</h1>

<h2>Introduction</h2>
<p>This document covers: <strong>${prompt}</strong></p>

<h2>Overview</h2>
<p>This section provides a high-level overview of the topic and its significance.</p>

<h2>Details</h2>
<p>Here we dive deeper into the specifics:</p>
<ul>
<li>Key point 1</li>
<li>Key point 2</li>
<li>Key point 3</li>
</ul>

<h2>Considerations</h2>
<p>Important factors to keep in mind:</p>
<ol>
<li>Factor one</li>
<li>Factor two</li>
<li>Factor three</li>
</ol>

<h2>Conclusion</h2>
<p>Summary and next steps to be determined based on further discussion.</p>

<h2>References</h2>
<p>Add any relevant references or resources here.</p>
  `.trim();
}

// AI Today Summary
export async function getTodaySummary(projectId, tasks, currentUser) {
    await delay(1000);

    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const myTasks = projectTasks.filter(t => t.assigned_to === currentUser.id);
    const overdue = myTasks.filter(t =>
        t.status !== 'Done' && new Date(t.due_date) < new Date()
    );
    const dueToday = myTasks.filter(t => {
        const dueDate = new Date(t.due_date).toDateString();
        return t.status !== 'Done' && dueDate === new Date().toDateString();
    });
    const inProgress = myTasks.filter(t => t.status === 'In Progress');

    let summary = '';

    if (overdue.length > 0) {
        summary += `⚠️ You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} that need attention.\n\n`;
    }

    if (dueToday.length > 0) {
        summary += `📅 ${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today:\n`;
        dueToday.forEach(t => {
            summary += `• ${t.name}\n`;
        });
        summary += '\n';
    }

    if (inProgress.length > 0) {
        summary += `🔄 Currently in progress:\n`;
        inProgress.forEach(t => {
            summary += `• ${t.name}\n`;
        });
        summary += '\n';
    }

    if (summary === '') {
        summary = "✨ You're all caught up! No urgent tasks for today. Consider planning ahead or helping teammates.";
    } else {
        summary += `\n💡 Tip: Focus on completing overdue items first, then tackle today's tasks.`;
    }

    return summary;
}

// Utility functions
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function getNextDayOfWeek(dayOfWeek) {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    return daysUntil;
}

function truncate(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}
