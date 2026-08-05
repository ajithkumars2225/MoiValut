package com.moi.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class MoiResponse {
    private Long transactionId;
    private Long serialNumber;
    private String contributorName;
    private String village;
    private BigDecimal amount;
    private LocalDateTime transactionDate;
    private Long eventId;
}
