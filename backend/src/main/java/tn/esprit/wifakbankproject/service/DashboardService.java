package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.dto.AppEntry;
import tn.esprit.wifakbankproject.entity.Application;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.exception.ResourceNotFoundException;
import tn.esprit.wifakbankproject.repository.UserRepository;
import tn.esprit.wifakbankproject.repository.UserRoleRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository     userRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional(readOnly = true)
    public List<AppEntry> getAuthorizedApps(String login) {
        User user = userRepository.findByLogin(login)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + login));

        List<Application> apps = userRoleRepository.findAuthorizedApplicationsByUserId(user.getId());

        return apps.stream()
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
