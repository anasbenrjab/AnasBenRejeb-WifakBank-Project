package tn.esprit.wifakbankproject.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.ldap.authentication.BindAuthenticator;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.security.ldap.authentication.ad.ActiveDirectoryLdapAuthenticationProvider;
import org.springframework.security.ldap.search.FilterBasedLdapUserSearch;
import org.springframework.security.ldap.server.UnboundIdContainer;
import org.springframework.security.ldap.userdetails.DefaultLdapAuthoritiesPopulator;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tn.esprit.wifakbankproject.security.JwtAuthFilter;

import java.util.List;

/**
 * Spring Security 7 / Spring Boot 4 configuration.
 *
 * Verified against Spring Security 7.0.x source (branch 7.0.x on GitHub):
 *
 *  ✅ ActiveDirectoryLdapAuthenticationProvider package UNCHANGED:
 *       org.springframework.security.ldap.authentication.ad
 *  ✅ Lambda DSL is now the ONLY style (non-lambda DSL removed in SS 7) — already used
 *  ✅ AbstractHttpConfigurer::disable — still valid
 *  ✅ SessionCreationPolicy.STATELESS — still valid
 *  ✅ http.authenticationProvider(provider) — still valid
 *  ✅ ProviderManager — still valid (replaces AuthenticationManagerBuilder pattern)
 *
 * Spring Boot 4 pom.xml changes applied:
 *  ✅ spring-boot-starter-web renamed → spring-boot-starter-webmvc
 *  ✅ Test starters now follow spring-boot-starter-<tech>-test convention
 *
 * Profile-based authentication strategy:
 *
 *   "dev"   → Embedded UnboundID LDAP via LdapAuthenticationProvider + BindAuthenticator
 *             (embedded server uses uid= DNs, not AD UPN format — AD provider would fail)
 *
 *   default → Real Active Directory via ActiveDirectoryLdapAuthenticationProvider
 *             Switch to real AD: change ONLY app.ad.domain + app.ad.url in properties.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${app.cors.allowed-origins}")
    private String corsAllowedOrigins;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          AuthenticationProvider authenticationProvider) {
        this.jwtAuthFilter        = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
    }

    // ── Password Encoder (used for LOCAL auth) ─────────────────────────────
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ── AuthenticationManager (used by AuthService) ───────────────────────────
    @Bean
    public AuthenticationManager authenticationManager() {
        return new ProviderManager(authenticationProvider);
    }

    // ── HTTP Security (Spring Security 7 Lambda DSL — only supported style) ───
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(401);
                    response.getWriter().write("{\"status\":401,\"message\":\"Non authentifié.\",\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(403);
                    response.getWriter().write("{\"status\":403,\"message\":\"Accès refusé.\",\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"}");
                }))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        // Disable frame options for H2 console
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()));

        return http.build();
    }

    // ── CORS ──────────────────────────────────────────────────────────────────
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(corsAllowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }


    // ══════════════════════════════════════════════════════════════════════════
    // Authentication Provider Factories — separated into a companion config
    // so @Profile beans resolve before SecurityConfig is constructed.
    // ══════════════════════════════════════════════════════════════════════════

    @Configuration
    static class AuthProviderConfig {

        @Value("${app.ad.domain}")
        private String adDomain;

        @Value("${app.ad.url}")
        private String adUrl;

        /**
         * DEV profile: spin up the embedded UnboundID LDAP server explicitly.
         *
         * Spring Boot 4 no longer auto-registers UnboundIdContainer as a bean
         * from spring.ldap.embedded.* properties alone — we must declare it here
         * so it can be injected into embeddedLdapAuthProvider below.
         */
        @Bean
        @Profile("dev")
        UnboundIdContainer ldapContainer(
                @Value("${spring.ldap.embedded.port}") int port,
                @Value("${spring.ldap.embedded.base-dn}") String baseDn,
                @Value("${spring.ldap.embedded.ldif}") String ldif) {
            UnboundIdContainer container = new UnboundIdContainer(baseDn, ldif);
            // Use 0 to let the OS pick a free port, avoiding collisions between
            // hot-restarts where port 8389 may still be bound by the previous run.
            container.setPort(0);
            return container;
        }

        /**
         * DEV profile: real LDAP bind against the embedded UnboundID server.
         *
         * The embedded server stores users under ou=people with uid= RDNs.
         * BindAuthenticator searches (uid={0}) and then binds with the
         * matched entry's DN + supplied password — a true credential check,
         * just like ActiveDirectoryLdapAuthenticationProvider does on real AD.
         */
        @Bean
        @Profile("dev")
        AuthenticationProvider embeddedLdapAuthProvider(UnboundIdContainer ldapContainer) {
            LdapContextSource ctx = new LdapContextSource();
            ctx.setUrl("ldap://localhost:" + ldapContainer.getPort());
            ctx.setBase("dc=wifakbank,dc=tn");
            ctx.afterPropertiesSet();

            FilterBasedLdapUserSearch userSearch =
                    new FilterBasedLdapUserSearch("ou=people", "(uid={0})", ctx);

            BindAuthenticator authenticator = new BindAuthenticator(ctx);
            authenticator.setUserSearch(userSearch);
            authenticator.afterPropertiesSet();

            DefaultLdapAuthoritiesPopulator authoritiesPopulator =
                    new DefaultLdapAuthoritiesPopulator(ctx, "ou=groups");
            authoritiesPopulator.setGroupSearchFilter("(member={0})");

            return new LdapAuthenticationProvider(authenticator, authoritiesPopulator);
        }

        /**
         * PROD / default profile: real Active Directory via UPN bind.
         *
         * Package org.springframework.security.ldap.authentication.ad is
         * UNCHANGED in Spring Security 7.0.x (verified from GitHub 7.0.x branch).
         *
         * Constructor (domain, url) — unchanged.
         * setSearchFilter, setConvertSubErrorCodesToExceptions — unchanged.
         *
         * To point at a real AD: change ONLY these two values:
         *   app.ad.domain = your.domain.tn
         *   app.ad.url    = ldap://your-dc.domain.tn:389/
         */
        @Bean
        @Profile("!dev")
        AuthenticationProvider adAuthProvider() {
            ActiveDirectoryLdapAuthenticationProvider provider =
                    new ActiveDirectoryLdapAuthenticationProvider(adDomain, adUrl);

            // {0} = user@domain (UPN)  |  {1} = plain username
            provider.setSearchFilter("(|(uid={1})(sAMAccountName={1}))");
            provider.setConvertSubErrorCodesToExceptions(true);
            provider.setUseAuthenticationRequestCredentials(true);
            return provider;
        }
    }
}
