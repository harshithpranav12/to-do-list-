package com.example.todolist.task;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class TaskService {
    private final TaskRepository repository;

    public TaskService(TaskRepository repository) { this.repository = repository; }

    public TaskResponse create(TaskRequest request) {
        Task task = new Task(request.title().trim(), request.description(), request.priority(), request.dueDate());
        return TaskResponse.from(repository.save(task));
    }

    public List<TaskResponse> findAll(Boolean completed, Priority priority) {
        List<Task> tasks;
        if (completed != null && priority != null) tasks = repository.findByCompletedAndPriority(completed, priority);
        else if (completed != null) tasks = repository.findByCompleted(completed);
        else if (priority != null) tasks = repository.findByPriority(priority);
        else tasks = repository.findAll();
        return tasks.stream().map(TaskResponse::from).toList();
    }

    public TaskResponse findById(Long id) { return TaskResponse.from(getTask(id)); }

    public TaskResponse update(Long id, TaskRequest request) {
        Task task = getTask(id);
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        return TaskResponse.from(repository.save(task));
    }

    public TaskResponse updateStatus(Long id, boolean completed) {
        Task task = getTask(id);
        task.setCompleted(completed);
        return TaskResponse.from(repository.save(task));
    }

    public void delete(Long id) { repository.delete(getTask(id)); }

    private Task getTask(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Task " + id + " was not found"));
    }
}
