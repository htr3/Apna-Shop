package com.apnashop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "mobile_no", nullable = false)
    private String mobileNo;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    @Column(name = "trust_score")
    @Builder.Default
    private Integer trustScore = 100;

    @Column(name = "total_purchase")
    @Builder.Default
    private BigDecimal totalPurchase = BigDecimal.ZERO;

    @Column(name = "borrowed_amount")
    @Builder.Default
    private BigDecimal borrowedAmount = BigDecimal.ZERO;

    @Column(name = "is_risky")
    @Builder.Default
    private Boolean isRisky = false;
}
