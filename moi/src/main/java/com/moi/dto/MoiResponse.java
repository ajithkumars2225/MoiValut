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
    private BigDecimal returnAmount;
    private String giftTerm;
    private String notes;
    private LocalDateTime transactionDate;
    private Long eventId;
}
