package com.upvote.api.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuração de segurança: JWT stateless, CORS e regras de acesso
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/widget.js").permitAll()
                        .requestMatchers("/api/widget/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/canais/*").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                        .requestMatchers("/api/test/**").permitAll()
                        .requestMatchers("/api/stripe/webhook").permitAll()
                        .requestMatchers("/api/integrations/jira/callback").permitAll()
                        .requestMatchers("/api/integrations/clickup/callback").permitAll()
                        .requestMatchers("/api/webhooks/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Configuração para o widget: aceita qualquer origem (é embarcado em sites de parceiros)
        CorsConfiguration widgetConfig = new CorsConfiguration();
        widgetConfig.setAllowedOriginPatterns(List.of("*"));
        widgetConfig.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
        widgetConfig.setAllowedHeaders(List.of("*"));
        widgetConfig.setAllowCredentials(false);
        widgetConfig.setMaxAge(3600L);

        // Configuração para o restante da API: apenas origens autorizadas
        CorsConfiguration apiConfig = new CorsConfiguration();
        apiConfig.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        apiConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        apiConfig.setAllowedHeaders(List.of("*"));
        apiConfig.setAllowCredentials(true);
        apiConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/widget.js", widgetConfig);
        source.registerCorsConfiguration("/api/widget/**", widgetConfig);
        source.registerCorsConfiguration("/**", apiConfig);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
