# Pendo Track Events Instrumentation Summary

This document summarizes all Pendo Track Events that have been instrumented into the TaskFlow Todo App codebase.

## Overview

**Total Events Instrumented:** 30 events across 7 files

All events use the client-side Pendo tracking API with the format:
```javascript
pendo.track('event_name', { property1: 'value1', property2: 'value2' });
```

## Instrumented Files

1. **src/context/TaskContext.tsx** - Core task and category management events
2. **src/components/tasks/TaskForm.tsx** - Task form and subtask events
3. **src/pages/TasksPage.tsx** - Task filtering, sorting, and navigation events
4. **src/components/tasks/TaskFilters.tsx** - Search event
5. **src/pages/Dashboard.tsx** - Quick add and dashboard navigation events
6. **src/pages/TaskDetailPage.tsx** - Task view event
7. **src/components/tasks/TaskCard.tsx** - Edit and delete initiation events
8. **src/pages/CategoriesPage.tsx** - Category management and navigation events
9. **src/context/NotificationContext.tsx** - Notification and reminder events

---

## Event Details by Category

### Task Management Events (9 events)

#### 1. task_created
- **Location:** `src/context/TaskContext.tsx:178`
- **Fires when:** User successfully creates a new task
- **Properties:**
  - `task_priority` - Priority level of task
  - `has_due_date` - Boolean for due date presence
  - `has_description` - Boolean for description presence
  - `category_id` - Category ID
  - `has_subtasks` - Boolean for subtasks presence
  - `subtask_count` - Number of subtasks
  - `has_reminder` - Boolean for reminder presence
  - `reminder_type` - Type of reminder set
  - `creation_method` - "form" or overridden by quick add

#### 2. task_updated
- **Location:** `src/context/TaskContext.tsx:181`
- **Fires when:** User successfully updates an existing task
- **Properties:**
  - `task_id` - Task identifier
  - `task_priority` - Priority level
  - `has_due_date` - Boolean for due date presence
  - `category_id` - Category ID
  - `fields_changed` - Comma-separated list of changed fields
  - `has_subtasks` - Boolean for subtasks presence
  - `subtask_count` - Number of subtasks

#### 3. task_completed
- **Location:** `src/context/TaskContext.tsx:190`
- **Fires when:** User marks a task as completed
- **Properties:**
  - `task_id` - Task identifier
  - `task_priority` - Priority level
  - `category_id` - Category ID
  - `was_overdue` - Boolean if task was overdue
  - `had_due_date` - Boolean for due date presence
  - `completion_location` - Where task was completed
  - `days_to_complete` - Days from creation to completion
  - `had_subtasks` - Boolean for subtasks presence
  - `all_subtasks_completed` - Boolean if all subtasks completed

#### 4. task_uncompleted
- **Location:** `src/context/TaskContext.tsx:190`
- **Fires when:** User marks a completed task back to pending
- **Properties:**
  - `task_id` - Task identifier
  - `task_priority` - Priority level
  - `category_id` - Category ID
  - `was_completed_for_days` - Days task was in completed state

#### 5. task_deleted
- **Location:** `src/context/TaskContext.tsx:186`
- **Fires when:** User confirms deletion of a task
- **Properties:**
  - `task_id` - Task identifier
  - `task_status` - Status at deletion time
  - `task_priority` - Priority level
  - `category_id` - Category ID
  - `had_subtasks` - Boolean for subtasks presence
  - `subtask_count` - Number of subtasks
  - `deletion_location` - Where deletion occurred
  - `task_age_days` - Age of task in days

#### 6. task_viewed
- **Location:** `src/pages/TaskDetailPage.tsx:29`
- **Fires when:** User navigates to task detail page
- **Properties:**
  - `task_id` - Task identifier
  - `task_status` - Current status
  - `task_priority` - Priority level
  - `category_id` - Category ID
  - `has_subtasks` - Boolean for subtasks presence
  - `source_location` - Origin of navigation

#### 7. quick_add_task_used
- **Location:** `src/pages/Dashboard.tsx:32`
- **Fires when:** User creates task via quick add input
- **Properties:**
  - `task_title_length` - Character length of title
  - `default_category_used` - Boolean for default category usage
  - `total_tasks` - Total task count after creation

#### 8. task_edit_initiated
- **Location:** `src/components/tasks/TaskCard.tsx:41`
- **Fires when:** User clicks edit button on task
- **Properties:**
  - `task_id` - Task identifier
  - `task_status` - Current status
  - `source_location` - Where edit was initiated

#### 9. task_delete_initiated
- **Location:** `src/components/tasks/TaskCard.tsx:46`
- **Fires when:** User clicks delete button on task
- **Properties:**
  - `task_id` - Task identifier
  - `task_status` - Current status
  - `source_location` - Where delete was initiated

### Subtask Events (4 events)

#### 10. subtask_added
- **Location:** `src/components/tasks/TaskForm.tsx:66`
- **Fires when:** User adds a new subtask to task form
- **Properties:**
  - `task_id` - Task identifier or "new"
  - `subtask_count` - Total subtask count
  - `form_context` - "create" or "edit"

#### 11. subtask_removed
- **Location:** `src/components/tasks/TaskForm.tsx:84`
- **Fires when:** User removes a subtask from task form
- **Properties:**
  - `task_id` - Task identifier or "new"
  - `remaining_subtask_count` - Subtasks remaining
  - `form_context` - "create" or "edit"

#### 12. subtask_completed
- **Location:** `src/context/TaskContext.tsx:194`
- **Fires when:** User toggles subtask to completed
- **Properties:**
  - `task_id` - Task identifier
  - `subtask_id` - Subtask identifier
  - `total_subtasks` - Total count
  - `completed_subtasks` - Completed count
  - `subtask_completion_percentage` - Percentage completed

#### 13. subtask_uncompleted
- **Location:** `src/context/TaskContext.tsx:194`
- **Fires when:** User toggles subtask back to incomplete
- **Properties:**
  - `task_id` - Task identifier
  - `subtask_id` - Subtask identifier
  - `total_subtasks` - Total count
  - `completed_subtasks` - Completed count

### Category Events (4 events)

#### 14. category_created
- **Location:** `src/context/TaskContext.tsx:206`
- **Fires when:** User successfully creates new category
- **Properties:**
  - `category_name` - Name of category
  - `category_color` - Color hex code
  - `is_first_custom_category` - Boolean for first custom
  - `total_categories` - Total category count

#### 15. category_updated
- **Location:** `src/context/TaskContext.tsx:216`
- **Fires when:** User updates existing category
- **Properties:**
  - `category_id` - Category identifier
  - `category_name` - Updated name
  - `category_color` - Updated color
  - `fields_changed` - Comma-separated changed fields

#### 16. category_deleted
- **Location:** `src/context/TaskContext.tsx:220`
- **Fires when:** User confirms category deletion
- **Properties:**
  - `category_id` - Category identifier
  - `reassign_to_category_id` - Reassignment target
  - `affected_task_count` - Tasks affected

#### 17. category_tasks_viewed
- **Location:** `src/pages/CategoriesPage.tsx:184`
- **Fires when:** User clicks to view tasks in category
- **Properties:**
  - `category_id` - Category identifier
  - `category_name` - Category name
  - `task_count` - Number of tasks

### Navigation & Filtering Events (5 events)

#### 18. task_filter_applied
- **Location:** `src/pages/TasksPage.tsx:31`
- **Fires when:** User applies status, priority, or category filter
- **Properties:**
  - `filter_type` - Type of filter applied
  - `filter_value` - Value of filter
  - `active_filters` - Comma-separated active filters
  - `result_count` - Number of results

#### 19. task_search_performed
- **Location:** `src/components/tasks/TaskFilters.tsx:26`
- **Fires when:** User performs search (debounced 1 second)
- **Properties:**
  - `search_query` - Search text
  - `result_count` - Number of results
  - `has_other_filters` - Boolean for other active filters

#### 20. task_sort_changed
- **Location:** `src/pages/TasksPage.tsx:42`
- **Fires when:** User changes task sort order
- **Properties:**
  - `sort_type` - New sort type
  - `previous_sort_type` - Previous sort type
  - `task_count` - Total tasks

#### 21. filters_cleared
- **Location:** `src/pages/TasksPage.tsx:129`
- **Fires when:** User clicks clear filters button
- **Properties:**
  - `previous_filters` - JSON of previous filters
  - `previous_sort` - Previous sort type

#### 22. dashboard_stat_clicked
- **Location:** `src/pages/Dashboard.tsx:76`
- **Fires when:** User clicks dashboard stat card
- **Properties:**
  - `stat_type` - Type of stat (total, completed, pending, overdue)
  - `stat_value` - Value of stat
  - `target_filter` - Target filter after navigation

### Notification Events (6 events)

#### 23. reminder_triggered
- **Location:** `src/context/NotificationContext.tsx:100`
- **Fires when:** System triggers reminder notification
- **Properties:**
  - `task_id` - Task identifier
  - `task_title` - Task title
  - `reminder_type` - Type of reminder
  - `task_priority` - Priority level
  - `minutes_until_due` - Minutes until due
  - `notification_permission_status` - Browser permission

#### 24. overdue_notification_created
- **Location:** `src/context/NotificationContext.tsx:111`
- **Fires when:** System creates overdue notification
- **Properties:**
  - `task_id` - Task identifier
  - `task_title` - Task title
  - `task_priority` - Priority level
  - `days_overdue` - Days overdue
  - `notification_permission_status` - Browser permission

#### 25. notification_permission_requested
- **Location:** `src/context/NotificationContext.tsx:84`
- **Fires when:** App requests notification permission
- **Properties:**
  - `permission_result` - Result of request
  - `request_trigger` - What triggered request

#### 26. notification_marked_read
- **Location:** `src/context/NotificationContext.tsx:70`
- **Fires when:** User marks notification as read
- **Properties:**
  - `notification_id` - Notification identifier
  - `notification_type` - Type of notification
  - `task_id` - Associated task
  - `time_since_created` - Minutes since creation

#### 27. all_notifications_marked_read
- **Location:** `src/context/NotificationContext.tsx:76`
- **Fires when:** User marks all notifications as read
- **Properties:**
  - `notification_count` - Total notifications
  - `unread_count` - Unread count

#### 28. notifications_cleared
- **Location:** `src/context/NotificationContext.tsx:80`
- **Fires when:** User clears all notifications
- **Properties:**
  - `notification_count` - Total notifications
  - `unread_count` - Unread count

### Validation Events (2 events)

#### 29. task_form_validation_error
- **Location:** `src/components/tasks/TaskForm.tsx:88`
- **Fires when:** Task form submission fails validation
- **Properties:**
  - `form_type` - "create" or "edit"
  - `error_fields` - Comma-separated error fields
  - `error_count` - Number of errors
  - `error_messages` - Semicolon-separated messages

#### 30. category_form_validation_error
- **Location:** `src/pages/CategoriesPage.tsx:43` and line 60
- **Fires when:** Category form submission fails validation
- **Properties:**
  - `form_type` - "create" or "update"
  - `error_type` - Field with error
  - `error_message` - Error message

---

## Implementation Notes

### Safety Checks
All events include safety checks for:
- Window object existence (server-side rendering compatibility)
- Pendo object availability
- Relevant data presence before tracking

### Event Pattern
```javascript
if (typeof window !== 'undefined' && (window as any).pendo) {
  (window as any).pendo.track('event_name', {
    property1: value1,
    property2: value2
  });
}
```

### Property Naming Conventions
- Use snake_case for property names
- Use descriptive names (e.g., `task_priority` not `priority`)
- Use consistent boolean prefixes (`has_`, `is_`, `was_`)
- Use consistent suffixes for counts (`_count`)

### Data Types Used
- **Strings:** For IDs, names, types, statuses
- **Numbers:** For counts, durations, percentages
- **Booleans:** For flags and conditions
- **Comma-separated strings:** For lists (active_filters, fields_changed)

---

## Testing Recommendations

1. **Verify Event Firing:**
   - Open browser console
   - Check for Pendo track calls in Network tab
   - Use Pendo Visual Design Studio to verify events

2. **Test Key Flows:**
   - Create, edit, complete, delete tasks
   - Add and manage subtasks
   - Create and manage categories
   - Filter, search, and sort tasks
   - Trigger and manage notifications

3. **Validate Properties:**
   - Ensure all properties have correct values
   - Check boolean values are true/false (not truthy/falsy)
   - Verify counts are accurate
   - Confirm IDs match expected format

4. **Edge Cases:**
   - Test with no data (empty states)
   - Test with many items (large lists)
   - Test rapid actions (debouncing)
   - Test validation errors

---

## Next Steps

1. **Pendo Setup:**
   - Ensure Pendo snippet is installed
   - Verify API key is configured
   - Enable Track Events in Pendo settings

2. **Data Validation:**
   - Review events in Pendo UI after 2 hours
   - Verify all 30 events appear
   - Check property data quality

3. **Analytics Setup:**
   - Create reports for key events
   - Set up funnels for conversion flows
   - Configure alerts for important metrics

4. **Documentation:**
   - Share event catalog with team
   - Document event usage guidelines
   - Create troubleshooting guide

---

## Summary Statistics

- **Total Events:** 30
- **Files Modified:** 9
- **Event Categories:**
  - Task Management: 9 events
  - Subtasks: 4 events
  - Categories: 4 events
  - Navigation & Filtering: 5 events
  - Notifications: 6 events
  - Validation: 2 events

All events follow Pendo best practices with:
- Descriptive, consistent naming
- Relevant, actionable properties
- Proper data types
- Safety checks for browser environment
- Clean, maintainable code
