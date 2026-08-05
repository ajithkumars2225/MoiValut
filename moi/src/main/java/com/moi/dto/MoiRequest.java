package com.moi.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MoiRequest {
    private Long eventId;
    private String contributorName;
    private String village;
    private BigDecimal amount;
}
