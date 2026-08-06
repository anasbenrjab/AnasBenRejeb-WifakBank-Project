package tn.esprit.wifakbankproject.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tn.esprit.wifakbankproject.repository.UserApplicationRoleRepository;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Reads the Bearer token from the Authorization header, validates it,
 * loads the user's authorities from USER_APPLICATION_ROLES (role noms),
 * and sets the authentication in the SecurityContext.
 * All API calls after login are stateless – no AD lookup happens here.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserApplicationRoleRepository userApplicationRoleRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest  request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain         chain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.isValid(token)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                String login = jwtUtil.extractLogin(token);

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                for (String roleName : userApplicationRoleRepository.findRoleNamesByLogin(login)) {
                    authorities.add(new SimpleGrantedAuthority(roleName));
                }

                var auth = new UsernamePasswordAuthenticationToken(
                        login,
                        null,
                        authorities);

                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        chain.doFilter(request, response);
    }
}
