package com.apnashop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {

    private double todaySales;
    private double monthSales;
    private double pendingUdhaar;
    private long trustableCount;
    private long riskyCount;
}
