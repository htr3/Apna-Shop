package com.apnashop.repository;

import com.apnashop.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Integer> {

    List<Sale> findByMobileNo(String mobileNo);

    List<Sale> findByMobileNoAndDateBetween(String mobileNo, Instant start, Instant end);

    Optional<Sale> findByIdAndMobileNo(Integer id, String mobileNo);
}
