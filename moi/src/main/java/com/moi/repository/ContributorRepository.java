package com.moi.repository;

import com.moi.model.Contributor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContributorRepository extends JpaRepository<Contributor, Long> {
    Optional<Contributor> findByNameAndVillage(String name, String village);

    @Query("SELECT DISTINCT c.village FROM Contributor c WHERE c.village IS NOT NULL")
    List<String> findDistinctVillages();
}
