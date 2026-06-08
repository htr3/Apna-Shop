package com.apnashop.service;

import com.apnashop.entity.PaymentSettings;
import com.apnashop.repository.PaymentSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentSettingsService {

    private final PaymentSettingsRepository paymentSettingsRepository;

    public PaymentSettings getSettings(String mobileNo) {
        return paymentSettingsRepository.findByMobileNo(mobileNo)
                .orElseGet(this::defaultSettings);
    }

    public Map<String, Object> getPublicSettings() {
        Optional<PaymentSettings> settings = paymentSettingsRepository.findFirstByOrderByIdAsc();
        if (settings.isEmpty()) {
            Map<String, Object> defaults = new LinkedHashMap<>();
            defaults.put("enableUpi", true);
            defaults.put("enableBankTransfer", false);
            defaults.put("enableCard", false);
            defaults.put("enableCash", true);
            defaults.put("ownerUpiId", null);
            defaults.put("ownerPhoneNumber", null);
            defaults.put("bankName", null);
            defaults.put("qrCodeUrl", null);
            return defaults;
        }

        PaymentSettings s = settings.get();
        Map<String, Object> publicSettings = new LinkedHashMap<>();
        publicSettings.put("enableUpi", s.getEnableUpi());
        publicSettings.put("enableBankTransfer", s.getEnableBankTransfer());
        publicSettings.put("enableCard", s.getEnableCard());
        publicSettings.put("enableCash", s.getEnableCash());
        publicSettings.put("ownerUpiId", s.getOwnerUpiId());
        publicSettings.put("ownerPhoneNumber", s.getOwnerPhoneNumber());
        publicSettings.put("bankName", s.getBankName());
        publicSettings.put("qrCodeUrl", s.getQrCodeUrl());
        return publicSettings;
    }

    @Transactional
    public PaymentSettings saveSettings(String mobileNo, Map<String, Object> body) {
        PaymentSettings settings = paymentSettingsRepository.findByMobileNo(mobileNo)
                .orElseGet(() -> PaymentSettings.builder().mobileNo(mobileNo).build());

        applyUpdates(settings, body);
        return paymentSettingsRepository.save(settings);
    }

    private PaymentSettings defaultSettings() {
        return PaymentSettings.builder()
                .enableUpi(true)
                .enableBankTransfer(false)
                .enableCard(false)
                .enableCash(true)
                .build();
    }

    private void applyUpdates(PaymentSettings settings, Map<String, Object> body) {
        setStringIfPresent(body, "ownerUpiId", settings::setOwnerUpiId);
        setStringIfPresent(body, "ownerUpiName", settings::setOwnerUpiName);
        setStringIfPresent(body, "ownerPhoneNumber", settings::setOwnerPhoneNumber);
        setStringIfPresent(body, "bankName", settings::setBankName);
        setStringIfPresent(body, "bankAccountNumber", settings::setBankAccountNumber);
        setStringIfPresent(body, "bankIfsc", settings::setBankIfsc);
        setStringIfPresent(body, "qrCodeUrl", settings::setQrCodeUrl);
        setStringIfPresent(body, "razorpayApiKey", settings::setRazorpayApiKey);
        setStringIfPresent(body, "razorpayWebhookSecret", settings::setRazorpayWebhookSecret);
        setBooleanIfPresent(body, "enableUpi", settings::setEnableUpi);
        setBooleanIfPresent(body, "enableBankTransfer", settings::setEnableBankTransfer);
        setBooleanIfPresent(body, "enableCard", settings::setEnableCard);
        setBooleanIfPresent(body, "enableCash", settings::setEnableCash);
    }

    private void setStringIfPresent(Map<String, Object> body, String key, java.util.function.Consumer<String> setter) {
        if (body.containsKey(key) && body.get(key) != null) {
            setter.accept(String.valueOf(body.get(key)));
        }
    }

    private void setBooleanIfPresent(Map<String, Object> body, String key, java.util.function.Consumer<Boolean> setter) {
        if (body.containsKey(key) && body.get(key) != null) {
            setter.accept(Boolean.valueOf(String.valueOf(body.get(key))));
        }
    }
}
