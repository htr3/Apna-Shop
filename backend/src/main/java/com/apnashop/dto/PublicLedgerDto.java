package com.apnashop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicLedgerDto {

    private String customerName;
    private String shopName;
    private BigDecimal outstanding;
    private Payment payment;
    private List<Entry> entries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Entry {
        private Instant date;
        private BigDecimal amount;
        private String notes;
        private Instant dueDate;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Payment {
        private Boolean enableUpi;
        private String ownerUpiId;
        private String ownerUpiName;
    }
}
