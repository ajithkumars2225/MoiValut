package com.moi.controller;

import com.moi.dto.GoldEntryRequest;
import com.moi.dto.GoldEntryResponse;
import com.moi.service.GoldEntryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gold")
@CrossOrigin(origins = "*")
public class GoldEntryController {

    private final GoldEntryService goldEntryService;

    public GoldEntryController(GoldEntryService goldEntryService) {
        this.goldEntryService = goldEntryService;
    }

    @PostMapping
    public ResponseEntity<GoldEntryResponse> recordGoldEntry(@RequestBody GoldEntryRequest request) {
        return ResponseEntity.ok(goldEntryService.recordGoldEntry(request));
    }

    @GetMapping("/event/{eventId}/recent")
    public ResponseEntity<List<GoldEntryResponse>> getRecentEntries(@PathVariable Long eventId) {
        return ResponseEntity.ok(goldEntryService.getRecent6Entries(eventId));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<GoldEntryResponse>> getAllEntriesByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(goldEntryService.getAllEntriesByEvent(eventId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoldEntryResponse> updateGoldEntry(@PathVariable Long id, @RequestBody GoldEntryRequest request) {
        return ResponseEntity.ok(goldEntryService.updateGoldEntry(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoldEntry(@PathVariable Long id) {
        goldEntryService.deleteGoldEntry(id);
        return ResponseEntity.ok().build();
    }
}

