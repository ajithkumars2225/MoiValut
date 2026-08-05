package com.moi.controller;

import com.moi.model.Event;
import com.moi.service.MoiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final MoiService moiService;

    public EventController(MoiService moiService) {
        this.moiService = moiService;
    }

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(moiService.getAllEvents());
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        return ResponseEntity.ok(moiService.createEvent(event));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        moiService.deleteEvent(id);
        return ResponseEntity.ok().build();
    }
}
