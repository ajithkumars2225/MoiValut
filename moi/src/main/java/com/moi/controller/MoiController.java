package com.moi.controller;

import com.moi.dto.MoiRequest;
import com.moi.dto.MoiResponse;
import com.moi.service.MoiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/moi")
@CrossOrigin(origins = "*")
public class MoiController {

    private final MoiService moiService;

    public MoiController(MoiService moiService) {
        this.moiService = moiService;
    }

    @PostMapping
    public ResponseEntity<MoiResponse> recordMoiTransaction(@RequestBody MoiRequest request) {
        return ResponseEntity.ok(moiService.recordMoi(request));
    }

    @GetMapping
    public ResponseEntity<List<MoiResponse>> getAllTransactions() {
        return ResponseEntity.ok(moiService.getAllTransactions());
    }

    @GetMapping("/villages")
    public ResponseEntity<List<String>> getAllVillages() {
        return ResponseEntity.ok(moiService.getAllVillages());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MoiResponse> updateMoiTransaction(@PathVariable Long id, @RequestBody MoiRequest request) {
        return ResponseEntity.ok(moiService.updateMoi(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMoiTransaction(@PathVariable Long id) {
        moiService.deleteMoi(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<MoiResponse>> getTransactionsForEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(moiService.getTransactionsByEvent(eventId));
    }
}
