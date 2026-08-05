package com.moi.repository;

import com.moi.model.MoiTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoiTransactionRepository extends JpaRepository<MoiTransaction, Long> {
    List<MoiTransaction> findByEventId(Long eventId);
    void deleteByEventId(Long eventId);
}
