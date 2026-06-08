package com.apnashop.repository;

import com.apnashop.entity.PaymentSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentSettingsRepository extends JpaRepository<PaymentSettings, Integer> {

    Optional<PaymentSettings> findByMobileNo(String mobileNo);

    Optional<PaymentSettings> findFirstByOrderByIdAsc();
}
