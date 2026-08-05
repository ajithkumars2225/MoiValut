package com.moi.dto;

import lombok.Data;

@Data
public class GoldEntryRequest {
    private Long eventId;
    private String contributorName;
    private String village;
    private String goldDetails;
}
