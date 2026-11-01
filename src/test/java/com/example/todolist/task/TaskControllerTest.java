package com.example.todolist.task;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:todo-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.h2.console.enabled=false"
})
@AutoConfigureMockMvc
class TaskControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    private String request(String title) throws Exception {
        return objectMapper.writeValueAsString(Map.of("title", title, "description", "Test detail", "priority", "HIGH"));
    }

    @Test
    void createRetrieveUpdateStatusFilterAndDeleteTask() throws Exception {
        String response = mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(request("Write tests")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.completed").value(false)).andExpect(jsonPath("$.createdAt").exists())
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(response).get("id").asLong();

        mvc.perform(get("/api/tasks/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Write tests"));
        mvc.perform(get("/api/tasks").param("completed", "false").param("priority", "HIGH"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(patch("/api/tasks/" + id + "/status").contentType(MediaType.APPLICATION_JSON).content("{\"completed\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.completed").value(true));
        mvc.perform(get("/api/tasks").param("completed", "true")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(put("/api/tasks/" + id).contentType(MediaType.APPLICATION_JSON).content(request("Updated title")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Updated title"));
        mvc.perform(delete("/api/tasks/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/tasks/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void rejectsBlankTitleAndInvalidPriority() throws Exception {
        mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(request("  ")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.details.title").exists());
        mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Bad priority\",\"priority\":\"URGENT\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Invalid JSON, date, or priority value"));
    }
}
