package com.apnashop.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.apnashop.dto.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String AUTH_USER_ATTR = "authUser";

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/health")
                || path.startsWith("/actuator")
                || path.equals("/api/login")
                || path.equals("/api/signup")
                || path.startsWith("/api/auth/")
                || path.equals("/api/payment-settings/public");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (request.getRequestURI().startsWith("/api")) {
                log.warn("Missing/invalid Authorization header for {} {}", request.getMethod(), request.getRequestURI());
            } else {
                log.debug("Missing/invalid Authorization header for {} {}", request.getMethod(), request.getRequestURI());
            }
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication token required");
            return;
        }

        String token = authHeader.substring(7);
        try {
            AuthUser authUser = jwtService.validateToken(token);
            request.setAttribute(AUTH_USER_ATTR, authUser);
            log.debug("Authenticated userId={} ({}) for {} {}", authUser.userId(), authUser.username(),
                    request.getMethod(), request.getRequestURI());
            filterChain.doFilter(request, response);
        } catch (Exception ex) {
            log.warn("Token validation failed for {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "Invalid or expired token");
        }
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), new ErrorResponse(message));
    }
}
