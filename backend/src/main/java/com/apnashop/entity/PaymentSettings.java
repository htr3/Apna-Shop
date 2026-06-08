package com.apnashop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "payment_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "mobile_no", nullable = false)
    private String mobileNo;

    @Column(name = "owner_upi_id")
    private String ownerUpiId;

    @Column(name = "owner_upi_name")
    private String ownerUpiName;

    @Column(name = "owner_phone_number")
    private String ownerPhoneNumber;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    @Column(name = "bank_ifsc")
    private String bankIfsc;

    @Column(name = "qr_code_url")
    private String qrCodeUrl;

    @Column(name = "razorpay_api_key")
    private String razorpayApiKey;

    @Column(name = "razorpay_webhook_secret")
    private String razorpayWebhookSecret;

    @Column(name = "enable_upi")
    @Builder.Default
    private Boolean enableUpi = true;

    @Column(name = "enable_bank_transfer")
    @Builder.Default
    private Boolean enableBankTransfer = false;

    @Column(name = "enable_card")
    @Builder.Default
    private Boolean enableCard = false;

    @Column(name = "enable_cash")
    @Builder.Default
    private Boolean enableCash = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
