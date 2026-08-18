package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.dto.AppEntry;
import tn.esprit.wifakbankproject.entity.Application;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.exception.ResourceNotFoundException;
import tn.esprit.wifakbankproject.repository.UserApplicationRoleRepository;
import tn.esprit.wifakbankproject.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository                 userRepository;
    private final UserApplicationRoleRepository  userApplicationRoleRepository;

    @Transactional(readOnly = true)
    public List<AppEntry> getAuthorizedApps(String login) {
        User user = userRepository.findByLogin(login)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + login));

        // Return only ACTIVE applications the user has at least one role assignment for.
        // A user may hold multiple roles on the same application — deduplicate by app id.
        return userApplicationRoleRepository.findByUserId(user.getId()).stream()
                .map(uar -> uar.getApplication())
                .filter(app -> app.getStatus() == Application.Status.ACTIVE)
                .collect(java.util.stream.Collectors.toMap(
                        Application::getId,
                        app -> app,
                        (existing, duplicate) -> existing   // keep first on duplicate appId
                ))
                .values().stream()
                .map(app -> AppEntry.builder()
                        .id(app.getId())
                        .code(app.getCode())
                        .nom(app.getNom())
                        .description(app.getDescription())
                        .url(app.getUrl())
                        .icon(app.getIcon())
                        .build())
                .toList();
    }
}
