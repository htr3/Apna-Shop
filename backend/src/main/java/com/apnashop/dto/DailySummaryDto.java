package com.apnashop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySummaryDto {

    private Instant date;
    private double totalSales;
    private double totalExpenses;
    private double netProfit;
    private long newBorrowings;
    private double collectionsMade;
    private long overdueCount;
    private String summary;
}
