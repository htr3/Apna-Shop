package com.apnashop.controller;

import com.apnashop.entity.PaymentSettings;
import com.apnashop.security.AuthUser;
import com.apnashop.security.AuthUtil;
import com.apnashop.service.PaymentSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PaymentSettingsController {

    private final PaymentSettingsService paymentSettingsService;

    @GetMapping("/api/payment-settings")
    public PaymentSettings get(HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        return paymentSettingsService.getSettings(user.mobileNo());
    }

    @GetMapping("/api/payment-settings/public")
    public Map<String, Object> getPublic() {
        return paymentSettingsService.getPublicSettings();
    }

    @PostMapping("/api/payment-settings")
    public PaymentSettings save(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        return paymentSettingsService.saveSettings(user.mobileNo(), body);
    }
}
