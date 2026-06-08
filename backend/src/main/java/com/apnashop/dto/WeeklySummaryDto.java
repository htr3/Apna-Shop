package com.apnashop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklySummaryDto {

    private String week;
    private List<DailySummaryDto> dailySummaries;
    private double totalSales;
    private double totalExpenses;
    private double totalProfit;
    private double totalCollections;
    private double averageDailySales;
    private DailySummaryDto bestDay;
    private DailySummaryDto worstDay;
}
