package com.example.todolist.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record TaskRequest(
        @NotBlank(message = "Title is required") @Size(max = 120, message = "Title must be 120 characters or fewer") String title,
        @Size(max = 2000, message = "Description must be 2000 characters or fewer") String description,
        @NotNull(message = "Priority is required") Priority priority,
        LocalDate dueDate
) { }
