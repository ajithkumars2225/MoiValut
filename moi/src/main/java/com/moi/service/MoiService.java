package com.moi.service;

import com.moi.dto.MoiRequest;
import com.moi.dto.MoiResponse;
import com.moi.model.Contributor;
import com.moi.model.Event;
import com.moi.model.MoiTransaction;
import com.moi.repository.ContributorRepository;
import com.moi.repository.EventRepository;
import com.moi.repository.MoiTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MoiService {

    private final EventRepository eventRepository;
    private final ContributorRepository contributorRepository;
    private final MoiTransactionRepository moiTransactionRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public MoiService(EventRepository eventRepository, ContributorRepository contributorRepository, MoiTransactionRepository moiTransactionRepository, org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.eventRepository = eventRepository;
        this.contributorRepository = contributorRepository;
        this.moiTransactionRepository = moiTransactionRepository;
        this.jdbcTemplate = jdbcTemplate;
        
        // Migration: Drop notes column from main and event tables
        try {
            jdbcTemplate.execute("ALTER TABLE moi_transactions DROP COLUMN notes");
        } catch (Exception ignored) {}
        
        try {
            List<String> tables = jdbcTemplate.queryForList("SHOW TABLES LIKE 'event_%'", String.class);
            for (String table : tables) {
                try {
                    jdbcTemplate.execute("ALTER TABLE `" + table + "` DROP COLUMN notes");
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
    }

    private String getEventTableName(Event event) {
        String sanitized = event.getName().toLowerCase().replaceAll("[^a-z0-9]", "_");
        return "event_" + event.getId() + "_" + sanitized;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @Transactional
    public Event createEvent(Event event) {
        Event savedEvent = eventRepository.save(event);
        String tableName = getEventTableName(savedEvent);
        String goldTableName = "gold_event_" + savedEvent.getId() + "_" + savedEvent.getName().toLowerCase().replaceAll("[^a-z0-9]", "_");

        String createTableSql = "CREATE TABLE IF NOT EXISTS `" + tableName + "` (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "main_transaction_id BIGINT, " +
                "contributor_name VARCHAR(255), " +
                "village VARCHAR(255), " +
                "amount DECIMAL(19, 2), " +
                "transaction_date DATETIME" +
                ")";
        
        String createGoldTableSql = "CREATE TABLE IF NOT EXISTS `" + goldTableName + "` (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "main_gold_id BIGINT, " +
                "contributor_name VARCHAR(255), " +
                "village VARCHAR(255), " +
                "gold_details TEXT, " +
                "entry_date DATETIME" +
                ")";

        jdbcTemplate.execute(createTableSql);
        jdbcTemplate.execute(createGoldTableSql);
        return savedEvent;
    }

    @Transactional
    public MoiResponse recordMoi(MoiRequest request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        Contributor contributor = contributorRepository.findByNameAndVillage(request.getContributorName(), request.getVillage())
                .orElseGet(() -> {
                    Contributor newContributor = new Contributor();
                    newContributor.setName(request.getContributorName());
                    newContributor.setVillage(request.getVillage());
                    return contributorRepository.save(newContributor);
                });

        MoiTransaction transaction = new MoiTransaction();
        transaction.setAmount(request.getAmount());
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setEvent(event);
        transaction.setContributor(contributor);

        MoiTransaction savedTransaction = moiTransactionRepository.save(transaction);

        // Record in specific event table
        String tableName = getEventTableName(event);
        String insertSql = "INSERT INTO `" + tableName + "` (main_transaction_id, contributor_name, village, amount, transaction_date) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(insertSql, savedTransaction.getId(), contributor.getName(), contributor.getVillage(), savedTransaction.getAmount(), savedTransaction.getTransactionDate());
        
        // Get serial number from event table
        Long serialNo = jdbcTemplate.queryForObject("SELECT id FROM `" + tableName + "` WHERE main_transaction_id = ?", Long.class, savedTransaction.getId());

        return MoiResponse.builder()
                .transactionId(savedTransaction.getId())
                .serialNumber(serialNo)
                .contributorName(contributor.getName())
                .village(contributor.getVillage())
                .amount(savedTransaction.getAmount())
                .transactionDate(savedTransaction.getTransactionDate())
                .eventId(event.getId())
                .build();
    }

    @Transactional
    public MoiResponse updateMoi(Long transactionId, MoiRequest request) {
        MoiTransaction tx = moiTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
                
        tx.getContributor().setName(request.getContributorName());
        tx.getContributor().setVillage(request.getVillage());
        contributorRepository.save(tx.getContributor());
        
        tx.setAmount(request.getAmount());
        moiTransactionRepository.save(tx);

        // Update in specific event table
        String tableName = getEventTableName(tx.getEvent());
        String updateSql = "UPDATE `" + tableName + "` SET contributor_name = ?, village = ?, amount = ? WHERE main_transaction_id = ?";
        jdbcTemplate.update(updateSql, request.getContributorName(), request.getVillage(), request.getAmount(), transactionId);
        
        // Get serial number
        Long serialNo = jdbcTemplate.queryForObject("SELECT id FROM `" + tableName + "` WHERE main_transaction_id = ?", Long.class, transactionId);
        
        return MoiResponse.builder()
                .transactionId(tx.getId())
                .serialNumber(serialNo)
                .contributorName(tx.getContributor().getName())
                .village(tx.getContributor().getVillage())
                .amount(tx.getAmount())
                .transactionDate(tx.getTransactionDate())
                .eventId(tx.getEvent().getId())
                .build();
    }
    
    @Transactional
    public void deleteMoi(Long transactionId) {
        MoiTransaction tx = moiTransactionRepository.findById(transactionId).orElse(null);
        if (tx != null) {
            String tableName = getEventTableName(tx.getEvent());
            jdbcTemplate.update("DELETE FROM `" + tableName + "` WHERE main_transaction_id = ?", transactionId);
            moiTransactionRepository.deleteById(transactionId);
        }
    }

    public List<MoiResponse> getTransactionsByEvent(Long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        String tableName = getEventTableName(event);
        
        // For new system, we fetch from the event-specific table to get correct serial number (id)
        try {
            return jdbcTemplate.query("SELECT * FROM `" + tableName + "` ORDER BY id", (rs, rowNum) -> MoiResponse.builder()
                        .transactionId(rs.getLong("main_transaction_id"))
                        .serialNumber(rs.getLong("id"))
                        .contributorName(rs.getString("contributor_name"))
                        .village(rs.getString("village"))
                        .amount(rs.getBigDecimal("amount"))
                        .transactionDate(rs.getTimestamp("transaction_date").toLocalDateTime())
                        .eventId(eventId)
                        .build());
        } catch (Exception e) {
            // Fallback to main table if event table doesn't exist yet (for legacy)
            return moiTransactionRepository.findByEventId(eventId).stream()
                .map(tx -> MoiResponse.builder()
                        .transactionId(tx.getId())
                        .serialNumber(tx.getId())
                        .contributorName(tx.getContributor().getName())
                        .village(tx.getContributor().getVillage())
                        .amount(tx.getAmount())
                        .transactionDate(tx.getTransactionDate())
                        .eventId(tx.getEvent().getId())
                        .build())
                .collect(Collectors.toList());
        }
    }

    public List<MoiResponse> getAllTransactions() {
        return moiTransactionRepository.findAll().stream()
                .map(tx -> MoiResponse.builder()
                        .transactionId(tx.getId())
                        .serialNumber(tx.getId())
                        .contributorName(tx.getContributor().getName())
                        .village(tx.getContributor().getVillage())
                        .amount(tx.getAmount())
                        .transactionDate(tx.getTransactionDate())
                        .eventId(tx.getEvent().getId())
                        .build())
                .collect(Collectors.toList());
    }

    public List<String> getAllVillages() {
        return contributorRepository.findDistinctVillages();
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        
        // 1. Drop the dynamic event table
        String tableName = getEventTableName(event);
        String goldTableName = "gold_event_" + event.getId() + "_" + event.getName().toLowerCase().replaceAll("[^a-z0-9]", "_");
        try {
            jdbcTemplate.execute("DROP TABLE IF EXISTS `" + tableName + "`");
            jdbcTemplate.execute("DROP TABLE IF EXISTS `" + goldTableName + "`");
        } catch (Exception e) {
            System.err.println("Table not found or already dropped: " + tableName + " or " + goldTableName);
        }
        
        // 2. Delete all records from the main moi_transactions table for this event
        moiTransactionRepository.deleteByEventId(eventId);
        
        // 3. Delete the event from events table
        eventRepository.deleteById(eventId);
        
        // 4. If no events left, reset the auto-increment so the next ID starts from 1
        if (eventRepository.count() == 0) {
            try {
                jdbcTemplate.execute("ALTER TABLE events AUTO_INCREMENT = 1");
                // Also reset the main transactions table if it's empty
                if (moiTransactionRepository.count() == 0) {
                    jdbcTemplate.execute("ALTER TABLE moi_transactions AUTO_INCREMENT = 1");
                }
            } catch (Exception e) {
                System.err.println("Failed to reset auto-increment: " + e.getMessage());
            }
        }
    }
}
