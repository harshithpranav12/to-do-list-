package com.example.todolist.task;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(Long id, String title, String description, boolean completed, Priority priority,
                           LocalDate dueDate, LocalDateTime createdAt, LocalDateTime updatedAt) {
    static TaskResponse from(Task task) {
        return new TaskResponse(task.getId(), task.getTitle(), task.getDescription(), task.isCompleted(),
                task.getPriority(), task.getDueDate(), task.getCreatedAt(), task.getUpdatedAt());
    }
}
