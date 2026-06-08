package com.apnashop.service;

import com.apnashop.dto.AuthResponse;
import com.apnashop.dto.SignupRequest;
import com.apnashop.dto.UserDto;
import com.apnashop.entity.User;
import com.apnashop.exception.ApiException;
import com.apnashop.repository.UserRepository;
import com.apnashop.security.AuthUser;
import com.apnashop.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthResponse login(String username, String password) {
        log.info("Login attempt for username '{}'", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Login failed: username '{}' not found", username);
                    return new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
                });

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            log.warn("Login failed: account '{}' is deactivated", username);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Account is deactivated");
        }

        if (!user.getPassword().equals(password)) {
            log.warn("Login failed: wrong password for username '{}'", username);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        AuthUser authUser = toAuthUser(user);
        String token = jwtService.generateToken(authUser);
        log.info("Login successful for username '{}' (userId={})", username, user.getId());

        return AuthResponse.builder()
                .success(true)
                .token(token)
                .user(toUserDto(user))
                .build();
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        log.info("Signup attempt for username '{}' (mobile {})", request.getUsername(), request.getMobileNo());
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Passwords don't match");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already taken");
        }

        if (userRepository.existsByMobileNo(request.getMobileNo())) {
            throw new ApiException(HttpStatus.CONFLICT, "Mobile number already registered");
        }

        User user = User.builder()
                .mobileNo(request.getMobileNo())
                .username(request.getUsername())
                .password(request.getPassword())
                .role("OWNER")
                .isActive(true)
                .build();

        user = userRepository.save(user);
        log.info("Signup successful for username '{}' (userId={})", user.getUsername(), user.getId());

        return AuthResponse.builder()
                .success(true)
                .username(user.getUsername())
                .mobileNo(user.getMobileNo())
                .build();
    }

    private AuthUser toAuthUser(User user) {
        return new AuthUser(
                user.getId(),
                user.getUsername(),
                user.getMobileNo(),
                user.getRole() != null ? user.getRole() : "OWNER"
        );
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .mobileNo(user.getMobileNo())
                .role(user.getRole())
                .build();
    }
}
