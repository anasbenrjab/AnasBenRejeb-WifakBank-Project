package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.dto.AppEntry;
import tn.esprit.wifakbankproject.entity.Application;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.exception.ResourceNotFoundException;
import tn.esprit.wifakbankproject.repository.ApplicationRepository;
import tn.esprit.wifakbankproject.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository         userRepository;
    private final ApplicationRepository applicationRepository;

    @Transactional(readOnly = true)
    public List<AppEntry> getAuthorizedApps(String login) {
        // Verify user exists
        userRepository.findByLogin(login)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + login));

        // Since roles are now standalone, return all ACTIVE applications
        List<Application> apps = applicationRepository.findByStatus(Application.Status.ACTIVE);

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
