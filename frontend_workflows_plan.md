# 🎨 Implementation Plan: Workflows UI

## Goal
Implement the **Workflows** page in the frontend to allow users to view, manage, and create DAG workflows. This matches the backend capabilities we just refactored.

## 📦 Components to Create

### 1. `web/src/app/workflows/page.tsx`
- **Layout**: Similar to Dashboard/Workers.
- **Header**: "Workflows" title + "New Workflow" button.
- **Content**: A grid or list of active workflows.

### 2. `web/src/components/workflow-card.tsx`
- A visual card representing a single workflow.
- **Data**: ID, Status (Pending, Running, Completed), Progress bar, Node count.
- **Visuals**: Dynamic glow border (Cyan for running, Green for done, Red for failed).

### 3. `web/src/components/workflow-builder-modal.tsx` (Simple V1)
- A modal to submit a JSON workflow definition (to test the OCaml backend).
- Field for `JSON Payload`.
- Button "Submit to Orchestrator".

## 📝 Step-by-Step Implementation

1.  **[SETUP]** Create directory logic `web/src/app/workflows`.
2.  **[PAGE]** Create the main page with a placeholder list.
3.  **[CARD]** Design `WorkflowCard` component.
4.  **[MODAL]** Create the submission modal.
5.  **[LINK]** Ensure Sidebar links correctly to `/workflows`.

## 🎨 Design Reference
- **Theme**: Cyan/Teal.
- **Style**: Glassmorphism, consistent with "Jobs" page.
