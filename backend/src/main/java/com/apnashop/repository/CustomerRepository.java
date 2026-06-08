package com.apnashop.repository;

import com.apnashop.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    List<Customer> findByMobileNo(String mobileNo);

    Optional<Customer> findByMobileNoAndPhone(String mobileNo, String phone);
}
