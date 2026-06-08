package com.apnashop.controller;

import com.apnashop.dto.DashboardStatsDto;
import com.apnashop.security.AuthUser;
import com.apnashop.security.AuthUtil;
import com.apnashop.service.ShopService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final ShopService shopService;

    @GetMapping("/api/dashboard/stats")
    public DashboardStatsDto stats(HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        return shopService.getDashboardStats(user.mobileNo());
    }
}
