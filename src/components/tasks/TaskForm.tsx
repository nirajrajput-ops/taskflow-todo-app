import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Task, Subtask, Category } from '../../types';
import { Input, Textarea, Select } from '../common/Input';
import { Button } from '../common/Button';
import { SubtaskItem, SubtaskInput } from './SubtaskItem';
import { validateTaskForm, ValidationError } from '../../utils/validators';
import { getTodayDateString } from '../../utils/dateUtils';

interface TaskFormProps {
  initialData?: Task;
  categories: Category[];
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'reminderTriggered'>) => void;
  isEdit?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  categories,
  onSubmit,
  isEdit = false,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    dueDate: initialData?.dueDate || '',
    dueTime: initialData?.dueTime || '',
    priority: initialData?.priority || 'medium',
    categoryId: initialData?.categoryId || (categories[0]?.id || 'other'),
    reminder: initialData?.reminder || 'none',
  });
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialData?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priorityOptions = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name,
  }));

  const reminderOptions = [
    { value: 'none', label: 'No Reminder' },
    { value: '15min', label: '15 minutes before' },
    { value: '1hour', label: '1 hour before' },
    { value: '1day', label: '1 day before' },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors(prev => prev.filter(err => err.field !== name));
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks(prev => [
        ...prev,
        { id: uuidv4(), title: newSubtask.trim(), completed: false },
      ]);
      setNewSubtask('');
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(prev =>
      prev.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    );
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== subtaskId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateTaskForm(formData, isEdit);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: (initialData?.status || 'pending') as 'pending' | 'completed',
      priority: formData.priority as 'high' | 'medium' | 'low',
      categoryId: formData.categoryId,
      dueDate: formData.dueDate || null,
      dueTime: formData.dueTime || null,
      reminder: formData.reminder as 'none' | '15min' | '1hour' | '1day',
      subtasks,
    };

    onSubmit(taskData);
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(err => err.field === field)?.message;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        placeholder="What needs to be done?"
        error={getFieldError('title')}
        required
        maxLength={100}
      />

      {/* Description */}
      <Textarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Add more details..."
        rows={3}
        maxLength={500}
        helperText={`${formData.description.length}/500`}
      />

      {/* Due Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Due Date"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleInputChange}
          min={isEdit ? undefined : getTodayDateString()}
          error={getFieldError('dueDate')}
        />
        <Input
          label="Due Time"
          name="dueTime"
          type="time"
          value={formData.dueTime}
          onChange={handleInputChange}
        />
      </div>

      {/* Priority & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Priority"
          name="priority"
          value={formData.priority}
          onChange={handleInputChange}
          options={priorityOptions}
        />
        <Select
          label="Category"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleInputChange}
          options={categoryOptions}
        />
      </div>

      {/* Reminder */}
      <Select
        label="Reminder"
        name="reminder"
        value={formData.reminder}
        onChange={handleInputChange}
        options={reminderOptions}
      />

      {/* Subtasks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtasks
        </label>
        <div className="space-y-2">
          {subtasks.map(subtask => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggle={() => handleToggleSubtask(subtask.id)}
              onRemove={() => handleRemoveSubtask(subtask.id)}
            />
          ))}
          <SubtaskInput
            value={newSubtask}
            onChange={setNewSubtask}
            onAdd={handleAddSubtask}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};
