package com.moi.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class GoldEntryResponse {
    private Long id;
    private Long serialNumber;
    private String contributorName;
    private String village;
    private String goldDetails;
    private LocalDateTime entryDate;
    private Long eventId;
}
