package com.example.todolist.task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByCompleted(boolean completed);
    List<Task> findByPriority(Priority priority);
    List<Task> findByCompletedAndPriority(boolean completed, Priority priority);
}
