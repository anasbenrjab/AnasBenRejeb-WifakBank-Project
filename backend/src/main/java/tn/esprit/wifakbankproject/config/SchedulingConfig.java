package tn.esprit.wifakbankproject.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Activates Spring's {@code @Scheduled} task executor.
 *
 * Kept in its own lightweight {@code @Configuration} class so that scheduling
 * can be disabled in tests by excluding this class, without touching
 * {@link SecurityConfig} or {@link DataInitializer}.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
    // No beans needed — @EnableScheduling is the only purpose of this class.
}
