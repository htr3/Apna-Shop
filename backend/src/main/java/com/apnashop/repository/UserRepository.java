package com.apnashop.repository;

import com.apnashop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUsername(String username);

    Optional<User> findByMobileNo(String mobileNo);

    boolean existsByUsername(String username);

    boolean existsByMobileNo(String mobileNo);
}
