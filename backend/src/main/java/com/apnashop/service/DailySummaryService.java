package com.apnashop.service;

import com.apnashop.dto.DailySummaryDto;
import com.apnashop.dto.WeeklySummaryDto;
import com.apnashop.entity.Borrowing;
import com.apnashop.entity.BorrowingStatus;
import com.apnashop.entity.Sale;
import com.apnashop.repository.BorrowingRepository;
import com.apnashop.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DailySummaryService {

    private final SaleRepository saleRepository;
    private final BorrowingRepository borrowingRepository;
    private final ScheduledThreadPoolExecutor scheduler = new ScheduledThreadPoolExecutor(1);
    private final Map<String, ScheduledFuture<?>> scheduledJobs = new ConcurrentHashMap<>();

    public DailySummaryDto generateDailySummary(LocalDate date, String mobileNo) {
        Instant startOfDay = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusMillis(1);

        List<Sale> dailySales = saleRepository.findByMobileNoAndDateBetween(mobileNo, startOfDay, endOfDay);
        double totalSales = dailySales.stream()
                .mapToDouble(s -> s.getAmount().doubleValue())
                .sum();

        List<Borrowing> newBorrowings = borrowingRepository.findByMobileNoAndDateBetweenAndStatus(
                mobileNo, startOfDay, endOfDay, BorrowingStatus.PENDING);
        long newBorrowingsCount = newBorrowings.size();

        List<Borrowing> paidBorrowings = borrowingRepository.findByMobileNoAndDateBetweenAndStatus(
                mobileNo, startOfDay, endOfDay, BorrowingStatus.PAID);
        double collectionsMade = paidBorrowings.stream()
                .mapToDouble(b -> b.getAmount().doubleValue())
                .sum();

        List<Borrowing> overdueBorrowings = borrowingRepository.findByMobileNoAndStatusAndDueDateLessThanEqual(
                mobileNo, BorrowingStatus.OVERDUE, Instant.now());
        long overdueCount = overdueBorrowings.size();

        double totalExpenses = 0;
        double netProfit = totalSales - totalExpenses;
        String summary = buildSummaryText(date, totalSales, totalExpenses, netProfit,
                newBorrowingsCount, collectionsMade, overdueCount);

        return DailySummaryDto.builder()
                .date(startOfDay)
                .totalSales(totalSales)
                .totalExpenses(totalExpenses)
                .netProfit(netProfit)
                .newBorrowings(newBorrowingsCount)
                .collectionsMade(collectionsMade)
                .overdueCount(overdueCount)
                .summary(summary)
                .build();
    }

    public WeeklySummaryDto getWeeklySummary(String mobileNo) {
        List<DailySummaryDto> summaries = new ArrayList<>();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        for (int i = 6; i >= 0; i--) {
            summaries.add(generateDailySummary(today.minusDays(i), mobileNo));
        }

        double totalSales = summaries.stream().mapToDouble(DailySummaryDto::getTotalSales).sum();
        double totalExpenses = summaries.stream().mapToDouble(DailySummaryDto::getTotalExpenses).sum();
        double totalProfit = summaries.stream().mapToDouble(DailySummaryDto::getNetProfit).sum();
        double totalCollections = summaries.stream().mapToDouble(DailySummaryDto::getCollectionsMade).sum();

        DailySummaryDto bestDay = summaries.stream()
                .max(Comparator.comparingDouble(DailySummaryDto::getTotalSales))
                .orElse(summaries.getFirst());
        DailySummaryDto worstDay = summaries.stream()
                .min(Comparator.comparingDouble(DailySummaryDto::getTotalSales))
                .orElse(summaries.getFirst());

        String week = formatDate(summaries.getFirst().getDate()) + " - "
                + formatDate(summaries.getLast().getDate());

        return WeeklySummaryDto.builder()
                .week(week)
                .dailySummaries(summaries)
                .totalSales(totalSales)
                .totalExpenses(totalExpenses)
                .totalProfit(totalProfit)
                .totalCollections(totalCollections)
                .averageDailySales(totalSales / 7.0)
                .bestDay(bestDay)
                .worstDay(worstDay)
                .build();
    }

    public boolean sendDailySummary(String phoneNumber, DailySummaryDto summary) {
        // WhatsApp/SMS integration not configured; log for now.
        return phoneNumber != null && !phoneNumber.isBlank() && summary.getSummary() != null;
    }

    public Map<String, Object> scheduleDailySummary(String phoneNumber, int hour, int minute) {
        Instant now = Instant.now();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant scheduledInstant = today.atTime(hour, minute).toInstant(ZoneOffset.UTC);
        if (!scheduledInstant.isAfter(now)) {
            scheduledInstant = today.plusDays(1).atTime(hour, minute).toInstant(ZoneOffset.UTC);
        }

        long delayMs = scheduledInstant.toEpochMilli() - now.toEpochMilli();
        String key = phoneNumber + ":" + hour + ":" + minute;

        scheduledJobs.computeIfAbsent(key, k -> scheduler.schedule(
                () -> sendDailySummary(phoneNumber, generateDailySummary(LocalDate.now(ZoneOffset.UTC), phoneNumber)),
                delayMs,
                TimeUnit.MILLISECONDS
        ));

        return Map.of(
                "success", true,
                "scheduledFor", scheduledInstant.toString(),
                "timeUntilSummary", delayMs / (1000.0 * 60.0)
        );
    }

    private String buildSummaryText(
            LocalDate date,
            double sales,
            double expenses,
            double profit,
            long borrowings,
            double collections,
            long overdue
    ) {
        String dateStr = date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.US) + ", "
                + date.getMonth().getDisplayName(TextStyle.FULL, Locale.US) + " "
                + date.getDayOfMonth() + ", " + date.getYear();

        return """
                Daily Summary - %s
                
                📊 Sales & Revenue:
                • Total Sales: ₹%.2f
                • Total Expenses: ₹%.2f
                • Net Profit: ₹%.2f
                
                💰 Credit Management:
                • New Borrowings: %d
                • Collections Made: ₹%.2f
                • Overdue Payments: %d
                
                %s
                
                ---
                Generated: %s
                """.formatted(
                dateStr,
                sales,
                expenses,
                profit,
                borrowings,
                collections,
                overdue,
                profit >= 0 ? "✅ Profitable day!" : "⚠️ Loss recorded today.",
                Instant.now().toString()
        ).trim();
    }

    private String formatDate(Instant instant) {
        return DateTimeFormatter.ISO_LOCAL_DATE.format(instant.atZone(ZoneOffset.UTC));
    }
}
