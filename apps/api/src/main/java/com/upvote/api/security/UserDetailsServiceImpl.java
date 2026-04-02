package com.upvote.api.security;

import com.upvote.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Implementação do UserDetailsService que busca usuário pelo email
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));

        // Google-only users have no password hash — Spring Security User rejects null, use empty string.
        // Password is never checked here; authentication is done via JWT signature.
        String password = user.getPasswordHash() != null ? user.getPasswordHash() : "";

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                password,
                Collections.emptyList()
        );
    }
}
