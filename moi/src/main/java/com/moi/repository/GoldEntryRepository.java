package com.moi.repository;

import com.moi.model.Event;
import com.moi.model.GoldEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoldEntryRepository extends JpaRepository<GoldEntry, Long> {
    List<GoldEntry> findByEvent(Event event);
    List<GoldEntry> findByEventId(Long eventId);
    List<GoldEntry> findFirst6ByEventOrderByIdDesc(Event event);
}
