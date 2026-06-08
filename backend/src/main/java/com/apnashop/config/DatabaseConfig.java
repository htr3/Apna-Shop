package com.apnashop.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String configuredUrl,
            @Value("${spring.datasource.username}") String configuredUsername,
            @Value("${spring.datasource.password}") String configuredPassword,
            @Value("${DATABASE_URL:}") String databaseUrlEnv
    ) {
        String candidate = !databaseUrlEnv.isBlank() ? databaseUrlEnv : configuredUrl;

        if (candidate.startsWith("postgres://") || candidate.startsWith("postgresql://")) {
            return buildFromPostgresUrl(candidate);
        }

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(configuredUrl);
        dataSource.setUsername(configuredUsername);
        dataSource.setPassword(configuredPassword);
        return dataSource;
    }

    private DataSource buildFromPostgresUrl(String postgresUrl) {
        ParsedPostgresUrl parsed = parsePostgresUrl(postgresUrl);

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(parsed.jdbcUrl());
        dataSource.setUsername(parsed.username());
        dataSource.setPassword(parsed.password());
        return dataSource;
    }

    static ParsedPostgresUrl parsePostgresUrl(String postgresUrl) {
        String normalized = postgresUrl.replaceFirst("^postgresql://", "postgres://");
        URI uri = URI.create(normalized);

        String username = null;
        String password = null;
        if (uri.getUserInfo() != null) {
            String[] parts = uri.getUserInfo().split(":", 2);
            username = decode(parts[0]);
            if (parts.length > 1) {
                password = decode(parts[1]);
            }
        }

        String host = uri.getHost() == null ? "localhost" : uri.getHost();
        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String database = uri.getPath() == null || uri.getPath().isBlank()
                ? "postgres"
                : uri.getPath().substring(1);

        String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + database;
        if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
            jdbcUrl += "?" + uri.getQuery();
        }

        return new ParsedPostgresUrl(jdbcUrl, username, password);
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    record ParsedPostgresUrl(String jdbcUrl, String username, String password) {
    }
}
