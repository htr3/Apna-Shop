package com.apnashop.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

/**
 * The original Node/Postgres backend returned numeric columns as strings.
 * The frontend relies on that (e.g. sale.amount.includes(...), string money fields),
 * so we serialize BigDecimal as String to preserve the same API contract.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer bigDecimalAsString() {
        return builder -> {
            SimpleModule module = new SimpleModule();
            module.addSerializer(BigDecimal.class, ToStringSerializer.instance);
            builder.modulesToInstall(module);
        };
    }
}
