package com.apnashop.controller;

import com.apnashop.dto.DailySummaryDto;
import com.apnashop.dto.WeeklySummaryDto;
import com.apnashop.exception.ApiException;
import com.apnashop.security.AuthUser;
import com.apnashop.security.AuthUtil;
import com.apnashop.service.DailySummaryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DailySummaryController {

    private final DailySummaryService dailySummaryService;

    @GetMapping("/api/daily-summary/today")
    public DailySummaryDto today(HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        return dailySummaryService.generateDailySummary(LocalDate.now(ZoneOffset.UTC), user.mobileNo());
    }

    @GetMapping("/api/daily-summary/weekly")
    public WeeklySummaryDto weekly(HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        return dailySummaryService.getWeeklySummary(user.mobileNo());
    }

    @GetMapping("/api/daily-summary/{date}")
    public DailySummaryDto byDate(@PathVariable String date, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        LocalDate parsed;
        try {
            parsed = LocalDate.parse(date);
        } catch (DateTimeParseException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid date format");
        }
        return dailySummaryService.generateDailySummary(parsed, user.mobileNo());
    }

    @PostMapping("/api/daily-summary/send")
    public Map<String, Object> send(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        Object phoneNumber = body.get("phoneNumber");
        if (phoneNumber == null || String.valueOf(phoneNumber).isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phone number is required");
        }
        DailySummaryDto summary = dailySummaryService.generateDailySummary(LocalDate.now(ZoneOffset.UTC), user.mobileNo());
        boolean success = dailySummaryService.sendDailySummary(String.valueOf(phoneNumber), summary);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", success);
        response.put("message", success ? "Summary sent successfully" : "Failed to send summary");
        response.put("summary", summary);
        return response;
    }

    @PostMapping("/api/daily-summary/schedule")
    public Map<String, Object> schedule(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUtil.getAuthUser(request);
        Object phoneNumber = body.get("phoneNumber");
        if (phoneNumber == null || String.valueOf(phoneNumber).isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phone number is required");
        }
        int hour = body.get("hour") != null ? Integer.parseInt(String.valueOf(body.get("hour"))) : 20;
        int minute = body.get("minute") != null ? Integer.parseInt(String.valueOf(body.get("minute"))) : 0;

        Map<String, Object> scheduling = dailySummaryService.scheduleDailySummary(String.valueOf(phoneNumber), hour, minute);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Daily summary scheduled successfully");
        response.put("scheduling", scheduling);
        return response;
    }
}
