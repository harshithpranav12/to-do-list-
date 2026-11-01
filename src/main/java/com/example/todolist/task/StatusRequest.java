package com.example.todolist.task;

import jakarta.validation.constraints.NotNull;

public record StatusRequest(@NotNull(message = "Completed status is required") Boolean completed) { }
