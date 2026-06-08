package com.apnashop.service;

import com.apnashop.entity.User;
import com.apnashop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private static final String DEFAULT_MOBILE = "9999999999";
    private static final String DEFAULT_USERNAME = "owner";
    private static final String DEFAULT_PASSWORD = "owner123";

    private final UserRepository userRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByMobileNo(DEFAULT_MOBILE)) {
            return;
        }

        User owner = User.builder()
                .mobileNo(DEFAULT_MOBILE)
                .username(DEFAULT_USERNAME)
                .password(DEFAULT_PASSWORD)
                .role("OWNER")
                .isActive(true)
                .build();

        userRepository.save(owner);
        log.info("Seeded default owner user (mobile: {})", DEFAULT_MOBILE);
    }
}
