# Implementation Plan: Veta Action System (Pivot)

## Vision
Shift from a rigid Project Management tool to a Voice-First Intelligent Action System. The goal is to "Dump & Sort": The user speaks raw thoughts, and the AI organizes them into actionable items, creating a "Second Brain" for an executive.

## Core Concepts
- **Project** -> **Context / Tag** (Fluid categories).
- **Task** -> **Action** (Discrete unit of work).
- **Assignee** -> **Owner** (Who acts?).
- **Dashboard** -> **Command Center** ("Now" view).

## Phase 1: The "Stream" Dashboard (MVP) [COMPLETED]
- [x] **Refactor `Dashboard.jsx`**:
    - [x] Remove project grid.
    - [x] Create "Action Lists":
        - [x] 🔴 Immediate Actions (Do Now): Assigned to Self, Due Today/Overdue + Unassigned.
        - [x] ⏳ Waiting For (Accountability): Assigned to Others.
        - [x] 📥 Recent Captures (Inbox): Unprocessed voice notes.
- [x] **Create `ActionCard` component**:
    - [x] Minimalist design (Checkbox, Title, Person Icon, Context Chip, Action Badge).
- [x] **Update `App.jsx`**:
    - [x] Rename/Adjust routes.

## Phase 2: AI Brain Upgrade [COMPLETED]
- [x] **Modify `aiService.js`**:
    - [x] Update prompt to extract "Action Type" (todo, delegate, discuss, buy, read).
    - [x] Auto-tag "Contexts".
- [x] **Update `GlobalVoiceCapture.jsx`**:
    - [x] Simplify Preview Card.
    - [x] Show Action Type badge.
- [x] **Database**: Migration script created (`migration-add-action-type.sql`).

## Phase 3: Contexts & Organizing [COMPLETED]
- [x] Lightweight Project/Context Creation (Via "New Context" button & AI).
- [x] Archive/Done View (`/archive` page + Sidebar Link).
- [x] Edit Capability in Dashboard (`EditTaskModal` integration).

## Phase 4: Frictionless Refinement [COMPLETED]
- [x] **Simplify Terminology**: Removed "Context" and "Project" labels from main workflows.
- [x] **Editable Inbox**: Added modal to edit raw inbox content.
- [x] **Performance Optimization**: Reduced load timeouts from 60s to 10s.
- [x] **Health Check**: Added "Database Unavailable" UI indicator.

