import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Calendar, Flag, Trash2, Edit, Repeat } from 'lucide-react';
import { Task, Category } from '../../types';
import { getRelativeDueDate, isOverdue } from '../../utils/dateUtils';
import { Card } from '../common/Card';

interface TaskCardProps {
  task: Task;
  category?: Category;
  onToggleStatus: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  showActions?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  onToggleStatus,
  onDelete,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const overdue = isOverdue(task.dueDate, task.dueTime, task.status);

  const priorityColors = {
    high: 'text-red-500 bg-red-50',
    medium: 'text-yellow-500 bg-yellow-50',
    low: 'text-gray-500 bg-gray-50',
  };

  const handleCardClick = () => {
    navigate(`/tasks/${task.id}`);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStatus(task.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tasks/${task.id}/edit`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  return (
    <Card hover className="p-4" onClick={handleCardClick}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className={`
            flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
            transition-colors
            ${task.status === 'completed'
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-400 bg-white hover:border-green-500'
            }
          `}
        >
          {task.status === 'completed' && <Check className="h-3 w-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm font-medium ${
                task.status === 'completed'
                  ? 'text-gray-400 line-through'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleEditClick}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Edit task"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta info */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Category */}
            {category && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                }}
              >
                {category.name}
              </span>
            )}

            {/* Priority */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}
            >
              <Flag className="h-3 w-3" />
              {task.priority}
            </span>

            {/* Due date */}
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  overdue ? 'text-red-500 font-medium' : 'text-gray-500'
                }`}
              >
                <Calendar className="h-3 w-3" />
                {getRelativeDueDate(task.dueDate, task.dueTime, task.status)}
              </span>
            )}

            {/* Recurrence indicator */}
            {task.recurrence?.pattern !== 'none' && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                <Repeat className="h-3 w-3" />
                Recurring
              </span>
            )}

            {/* Subtasks progress */}
            {task.subtasks.length > 0 && (
              <span className="text-xs text-gray-500">
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
