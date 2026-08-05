package com.moi.service;

import com.moi.dto.GoldEntryRequest;
import com.moi.dto.GoldEntryResponse;
import com.moi.model.Contributor;
import com.moi.model.Event;
import com.moi.model.GoldEntry;
import com.moi.repository.ContributorRepository;
import com.moi.repository.EventRepository;
import com.moi.repository.GoldEntryRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GoldEntryService {

    private final EventRepository eventRepository;
    private final ContributorRepository contributorRepository;
    private final GoldEntryRepository goldEntryRepository;
    private final JdbcTemplate jdbcTemplate;

    public GoldEntryService(EventRepository eventRepository, 
                           ContributorRepository contributorRepository, 
                           GoldEntryRepository goldEntryRepository, 
                           JdbcTemplate jdbcTemplate) {
        this.eventRepository = eventRepository;
        this.contributorRepository = contributorRepository;
        this.goldEntryRepository = goldEntryRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    private String getGoldEventTableName(Event event) {
        String sanitized = event.getName().toLowerCase().replaceAll("[^a-z0-9]", "_");
        return "gold_event_" + event.getId() + "_" + sanitized;
    }

    @Transactional
    public GoldEntryResponse recordGoldEntry(GoldEntryRequest request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        Contributor contributor = contributorRepository.findByNameAndVillage(request.getContributorName(), request.getVillage())
                .orElseGet(() -> {
                    Contributor newContributor = new Contributor();
                    newContributor.setName(request.getContributorName());
                    newContributor.setVillage(request.getVillage());
                    return contributorRepository.save(newContributor);
                });

        GoldEntry entry = new GoldEntry();
        entry.setGoldDetails(request.getGoldDetails());
        entry.setEntryDate(LocalDateTime.now());
        entry.setEvent(event);
        entry.setContributor(contributor);

        GoldEntry savedEntry = goldEntryRepository.save(entry);

        // Record in specific gold event table
        String tableName = getGoldEventTableName(event);
        
        // Ensure table exists (in case it wasn't created at event creation)
        String createTableSql = "CREATE TABLE IF NOT EXISTS `" + tableName + "` (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "main_gold_id BIGINT, " +
                "contributor_name VARCHAR(255), " +
                "village VARCHAR(255), " +
                "gold_details TEXT, " +
                "entry_date DATETIME" +
                ")";
        jdbcTemplate.execute(createTableSql);

        String insertSql = "INSERT INTO `" + tableName + "` (main_gold_id, contributor_name, village, gold_details, entry_date) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(insertSql, savedEntry.getId(), contributor.getName(), contributor.getVillage(), savedEntry.getGoldDetails(), savedEntry.getEntryDate());
        
        // Get serial number (per-event ID)
        Long serialNo = jdbcTemplate.queryForObject("SELECT id FROM `" + tableName + "` WHERE main_gold_id = ?", Long.class, savedEntry.getId());

        return mapToResponse(savedEntry, serialNo);
    }

    public List<GoldEntryResponse> getRecent6Entries(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        String tableName = getGoldEventTableName(event);
        
        try {
            return jdbcTemplate.query("SELECT * FROM `" + tableName + "` ORDER BY id DESC LIMIT 6", (rs, rowNum) -> {
                return GoldEntryResponse.builder()
                        .id(rs.getLong("main_gold_id"))
                        .serialNumber(rs.getLong("id"))
                        .contributorName(rs.getString("contributor_name"))
                        .village(rs.getString("village"))
                        .goldDetails(rs.getString("gold_details"))
                        .entryDate(rs.getTimestamp("entry_date").toLocalDateTime())
                        .eventId(eventId)
                        .build();
            });
        } catch (Exception e) {
            // Fallback if table doesn't exist
            return goldEntryRepository.findFirst6ByEventOrderByIdDesc(event).stream()
                    .map(entry -> mapToResponse(entry, entry.getId()))
                    .collect(Collectors.toList());
        }
    }

    public List<GoldEntryResponse> getAllEntriesByEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        String tableName = getGoldEventTableName(event);
        
        try {
            return jdbcTemplate.query("SELECT * FROM `" + tableName + "` ORDER BY id ASC", (rs, rowNum) -> {
                return GoldEntryResponse.builder()
                        .id(rs.getLong("main_gold_id"))
                        .serialNumber(rs.getLong("id"))
                        .contributorName(rs.getString("contributor_name"))
                        .village(rs.getString("village"))
                        .goldDetails(rs.getString("gold_details"))
                        .entryDate(rs.getTimestamp("entry_date").toLocalDateTime())
                        .eventId(eventId)
                        .build();
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    @Transactional
    public GoldEntryResponse updateGoldEntry(Long id, GoldEntryRequest request) {
        GoldEntry entry = goldEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        
        entry.getContributor().setName(request.getContributorName());
        entry.getContributor().setVillage(request.getVillage());
        contributorRepository.save(entry.getContributor());
        
        entry.setGoldDetails(request.getGoldDetails());
        goldEntryRepository.save(entry);

        String tableName = getGoldEventTableName(entry.getEvent());
        String updateSql = "UPDATE `" + tableName + "` SET contributor_name = ?, village = ?, gold_details = ? WHERE main_gold_id = ?";
        jdbcTemplate.update(updateSql, request.getContributorName(), request.getVillage(), request.getGoldDetails(), id);
        
        Long serialNo = jdbcTemplate.queryForObject("SELECT id FROM `" + tableName + "` WHERE main_gold_id = ?", Long.class, id);
        
        return mapToResponse(entry, serialNo);
    }

    @Transactional
    public void deleteGoldEntry(Long id) {
        GoldEntry entry = goldEntryRepository.findById(id).orElse(null);
        if (entry != null) {
            String tableName = getGoldEventTableName(entry.getEvent());
            jdbcTemplate.update("DELETE FROM `" + tableName + "` WHERE main_gold_id = ?", id);
            goldEntryRepository.deleteById(id);
        }
    }

    private GoldEntryResponse mapToResponse(GoldEntry entry, Long serialNo) {
        return GoldEntryResponse.builder()
                .id(entry.getId())
                .serialNumber(serialNo)
                .contributorName(entry.getContributor().getName())
                .village(entry.getContributor().getVillage())
                .goldDetails(entry.getGoldDetails())
                .entryDate(entry.getEntryDate())
                .eventId(entry.getEvent().getId())
                .build();
    }
}

