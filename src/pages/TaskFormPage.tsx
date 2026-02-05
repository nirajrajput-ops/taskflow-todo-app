import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { Task } from '../types';
import { TaskForm } from '../components/tasks/TaskForm';
import { Card } from '../components/common/Card';
import { useToast } from '../components/common/Toast';

export const TaskFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, categories, addTask, updateTask } = useTasks();
  const { showToast } = useToast();

  const isEdit = !!id;
  const existingTask = id ? getTaskById(id) : undefined;

  // If editing but task not found
  if (isEdit && !existingTask) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Task Not Found</h1>
        <p className="text-gray-500 mb-4">
          The task you're trying to edit doesn't exist or has been deleted.
        </p>
        <button
          onClick={() => navigate('/tasks')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Go to Tasks
        </button>
      </div>
    );
  }

  const handleSubmit = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'reminderTriggered'>
  ) => {
    if (isEdit && existingTask) {
      // Calculate fields changed for tracking
      const fieldsChanged: string[] = [];
      if (existingTask.title !== taskData.title) fieldsChanged.push('title');
      if (existingTask.description !== taskData.description) fieldsChanged.push('description');
      if (existingTask.priority !== taskData.priority) fieldsChanged.push('priority');
      if (existingTask.categoryId !== taskData.categoryId) fieldsChanged.push('category');
      if (existingTask.dueDate !== taskData.dueDate || existingTask.dueTime !== taskData.dueTime) fieldsChanged.push('due_date');
      if (existingTask.reminder !== taskData.reminder) fieldsChanged.push('reminder');
      if (JSON.stringify(existingTask.subtasks) !== JSON.stringify(taskData.subtasks)) fieldsChanged.push('subtasks');

      const originalSubtaskCount = existingTask.subtasks.length;
      const newSubtaskCount = taskData.subtasks.length;
      const timeSinceCreation = Math.floor(
        (new Date().getTime() - new Date(existingTask.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      updateTask({
        ...existingTask,
        ...taskData,
        updatedAt: new Date().toISOString(),
      });

      // Track task_updated event
      if (typeof window !== 'undefined' && (window as any).pendo) {
        const category = categories.find(c => c.id === taskData.categoryId);
        (window as any).pendo.track('task_updated', {
          task_id: existingTask.id,
          fields_changed: fieldsChanged.join(','),
          priority_changed: fieldsChanged.includes('priority'),
          category_changed: fieldsChanged.includes('category'),
          due_date_changed: fieldsChanged.includes('due_date'),
          reminder_changed: fieldsChanged.includes('reminder'),
          subtasks_added: newSubtaskCount > originalSubtaskCount,
          subtasks_removed: newSubtaskCount < originalSubtaskCount,
          time_since_creation: timeSinceCreation,
        });
      }

      showToast('Task updated successfully!', 'success');
      navigate(`/tasks/${existingTask.id}`);
    } else {
      const newTaskData = taskData;

      addTask(newTaskData);

      // Track task_created event
      if (typeof window !== 'undefined' && (window as any).pendo) {
        const category = categories.find(c => c.id === taskData.categoryId);
        (window as any).pendo.track('task_created', {
          title_length: taskData.title.length,
          has_description: !!taskData.description && taskData.description.length > 0,
          priority: taskData.priority,
          category_id: taskData.categoryId,
          category_name: category?.name || 'Unknown',
          has_due_date: !!taskData.dueDate,
          has_due_time: !!taskData.dueTime,
          reminder_type: taskData.reminder,
          subtask_count: taskData.subtasks.length,
          creation_source: 'form',
        });
      }

      showToast('Task created successfully!', 'success');
      navigate('/tasks');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Task' : 'Create New Task'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEdit
              ? 'Update the task details below'
              : 'Fill in the details to create a new task'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <TaskForm
          initialData={existingTask}
          categories={categories}
          onSubmit={handleSubmit}
          isEdit={isEdit}
        />
      </Card>
    </div>
  );
};
