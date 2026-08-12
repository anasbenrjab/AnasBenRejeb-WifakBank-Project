package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.dto.ApplicationDto;
import tn.esprit.wifakbankproject.dto.ApplicationRoleDto;
import tn.esprit.wifakbankproject.dto.DepartmentDto;
import tn.esprit.wifakbankproject.dto.RoleDto;
import tn.esprit.wifakbankproject.dto.UserApplicationRoleDto;
import tn.esprit.wifakbankproject.dto.UserDto;
import tn.esprit.wifakbankproject.dto.SubDepartmentDto;
import tn.esprit.wifakbankproject.entity.Application;
import tn.esprit.wifakbankproject.entity.ApplicationRole;
import tn.esprit.wifakbankproject.entity.ApplicationRoleId;
import tn.esprit.wifakbankproject.entity.Department;
import tn.esprit.wifakbankproject.entity.Role;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.entity.UserApplicationRole;
import tn.esprit.wifakbankproject.entity.UserStatus;
import tn.esprit.wifakbankproject.entity.SubDepartment;
import tn.esprit.wifakbankproject.exception.DuplicateResourceException;
import tn.esprit.wifakbankproject.exception.ResourceInUseException;
import tn.esprit.wifakbankproject.exception.ResourceNotFoundException;
import tn.esprit.wifakbankproject.repository.ApplicationRepository;
import tn.esprit.wifakbankproject.repository.ApplicationRoleRepository;
import tn.esprit.wifakbankproject.repository.AuditLogRepository;
import tn.esprit.wifakbankproject.repository.DepartmentRepository;
import tn.esprit.wifakbankproject.repository.RoleRepository;
import tn.esprit.wifakbankproject.repository.UserApplicationRoleRepository;
import tn.esprit.wifakbankproject.repository.UserRepository;
import tn.esprit.wifakbankproject.repository.SubDepartmentRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationRoleRepository applicationRoleRepository;
    private final UserApplicationRoleRepository userApplicationRoleRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubDepartmentRepository subDepartmentRepository;

    // Users
    public List<UserDto> getAllUsers() {
        return userRepository.findAllWithApplicationRoles().stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        return userRepository.findByIdWithApplicationRoles(id)
                .map(this::mapToUserDto)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public UserDto createUser(UserDto userDto) {
        if (userRepository.existsByLogin(userDto.getLogin())) {
            throw new DuplicateResourceException("Ce login existe déjà.");
        }
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new DuplicateResourceException("Cet email existe déjà.");
        }

        User.UserBuilder userBuilder = User.builder()
                .login(userDto.getLogin())
                .nom(userDto.getNom())
                .prenom(userDto.getPrenom())
                .email(userDto.getEmail())
                .authType(userDto.getAuthType())
                .status(userDto.getStatus() != null ? userDto.getStatus() : UserStatus.ACTIF);

        if (userDto.getAuthType() == User.AuthType.LOCAL) {
            if (userDto.getPassword() == null || userDto.getPassword().isBlank()) {
                throw new IllegalArgumentException("Un mot de passe est requis pour les utilisateurs locaux.");
            }
            userBuilder.password(passwordEncoder.encode(userDto.getPassword()));
        }

        Department dept = null;
        if (userDto.getDepartment() != null && userDto.getDepartment().getId() != null) {
            dept = departmentRepository.findById(userDto.getDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
            userBuilder.department(dept);
        }

        if (userDto.getSubDepartmentId() != null) {
            SubDepartment subDept = subDepartmentRepository.findById(userDto.getSubDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sub-department not found"));
            if (dept == null) {
                throw new IllegalArgumentException("Department is required when assigning a sub-department.");
            }
            if (!subDept.getDepartment().getId().equals(dept.getId())) {
                throw new IllegalArgumentException("Sub-department does not belong to the selected department");
            }
            userBuilder.subDepartment(subDept);
        }

        User user = userBuilder.build();
        user = userRepository.save(user);

        if (userDto.getApplicationId() != null && userDto.getRoleId() != null) {
            assignRoleToUserInternal(user, userDto.getApplicationId(), userDto.getRoleId());
        } else if (userDto.getApplicationRoleApplicationIds() != null
                   && userDto.getApplicationRoleRoleIds() != null
                   && userDto.getApplicationRoleApplicationIds().size() == userDto.getApplicationRoleRoleIds().size()) {
            for (int i = 0; i < userDto.getApplicationRoleApplicationIds().size(); i++) {
                assignRoleToUserInternal(user,
                        userDto.getApplicationRoleApplicationIds().get(i),
                        userDto.getApplicationRoleRoleIds().get(i));
            }
        }

        user = userRepository.findByIdWithApplicationRoles(user.getId()).orElseThrow();
        return mapToUserDto(user);
    }

    public UserDto updateUser(Long id, UserDto userDto) {
        // Load WITHOUT roles so cascade=MERGE on save() has nothing to traverse.
        // Fetching roles here would populate the collection with managed entities;
        // the subsequent JPQL deletes in the same transaction then leave Hibernate's
        // first-level cache stale, causing NonUniqueObjectException on merge cascade.
        User user = userRepository.findByIdForScalarUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setNom(userDto.getNom());
        user.setPrenom(userDto.getPrenom());
        user.setEmail(userDto.getEmail());
        user.setStatus(userDto.getStatus());

        if (userDto.getDepartment() != null && userDto.getDepartment().getId() != null) {
            Department dept = departmentRepository.findById(userDto.getDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
            user.setDepartment(dept);

            if (userDto.getSubDepartmentId() != null) {
                SubDepartment subDept = subDepartmentRepository.findById(userDto.getSubDepartmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sub-department not found"));
                if (!subDept.getDepartment().getId().equals(dept.getId())) {
                    throw new IllegalArgumentException("Sub-department does not belong to the selected department");
                }
                user.setSubDepartment(subDept);
            } else {
                user.setSubDepartment(null);
            }
        } else {
            user.setDepartment(null);
            user.setSubDepartment(null);
        }

        // Persist scalar changes before touching roles so the user row is
        // stable when role insert FKs are resolved.
        userRepository.save(user);

        // ── Role assignment update ────────────────────────────────────────────
        // All role work goes through the repository directly — never through
        // user.getUserApplicationRoles() — to avoid cache/cascade conflicts.
        //
        //   • Full replacement (applicationRoleApplicationIds list provided):
        //     delete all current assignments, insert the complete new set.
        //   • Single-application update (applicationId + roleId provided):
        //     delete only the row for that application, insert the new one.
        //     All other applications' assignments are untouched.
        //   • Neither provided: scalar-only update, roles unchanged.

        if (userDto.getApplicationRoleApplicationIds() != null
                && userDto.getApplicationRoleRoleIds() != null
                && userDto.getApplicationRoleApplicationIds().size() == userDto.getApplicationRoleRoleIds().size()
                && !userDto.getApplicationRoleApplicationIds().isEmpty()) {

            List<Long> appIds  = userDto.getApplicationRoleApplicationIds();
            List<Long> roleIds = userDto.getApplicationRoleRoleIds();

            for (int i = 0; i < appIds.size(); i++) {
                Long appId = appIds.get(i);
                Long rId   = roleIds.get(i);
                if (!applicationRoleRepository.existsByApplicationIdAndRoleId(appId, rId)) {
                    Application app = applicationRepository.findById(appId).orElse(null);
                    Role r          = roleRepository.findById(rId).orElse(null);
                    throw new IllegalArgumentException(
                        "La paire (application=" + (app != null ? app.getCode() : appId)
                        + ", role=" + (r != null ? r.getNom() : rId) + ") n'existe pas dans APPLICATION_ROLES.");
                }
            }

            userApplicationRoleRepository.deleteAll(
                userApplicationRoleRepository.findByUserId(id));

            for (int i = 0; i < appIds.size(); i++) {
                Application app = applicationRepository.findById(appIds.get(i))
                        .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
                Role role = roleRepository.findById(roleIds.get(i))
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
                userApplicationRoleRepository.save(
                    UserApplicationRole.builder().user(user).application(app).role(role).build());
            }

        } else if (userDto.getApplicationId() != null && userDto.getRoleId() != null) {

            Long appId = userDto.getApplicationId();
            Long rId   = userDto.getRoleId();

            if (!applicationRoleRepository.existsByApplicationIdAndRoleId(appId, rId)) {
                Application app = applicationRepository.findById(appId).orElse(null);
                Role r          = roleRepository.findById(rId).orElse(null);
                throw new IllegalArgumentException(
                    "La paire (application=" + (app != null ? app.getCode() : appId)
                    + ", role=" + (r != null ? r.getNom() : rId) + ") n'existe pas dans APPLICATION_ROLES.");
            }

            userApplicationRoleRepository.deleteByUserIdAndApplicationId(id, appId);

            Application app = applicationRepository.findById(appId)
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + appId));
            Role role = roleRepository.findById(rId)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + rId));
            userApplicationRoleRepository.save(
                UserApplicationRole.builder().user(user).application(app).role(role).build());
        }

        // Reload with roles joined to build the response DTO
        return mapToUserDto(userRepository.findByIdWithApplicationRoles(id).orElseThrow());
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String currentLogin = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByLogin(currentLogin).orElse(null);

        if (currentUser != null && currentUser.getId().equals(id)) {
            throw new IllegalArgumentException("Vous ne pouvez pas supprimer votre propre compte.");
        }

        // AUDIT_LOG.USER_ID has a database-level FK to USERS(ID) with no ON DELETE
        // CASCADE (it was created by Hibernate ddl-auto=update with an auto-generated
        // constraint name). Audit history is intentionally kept — we just sever the
        // user reference so the FK constraint doesn't block the delete.
        auditLogRepository.detachUser(id);

        // USER_APPLICATION_ROLES is covered by both JPA cascade=ALL on
        // User.userApplicationRoles AND the database-level ON DELETE CASCADE on
        // FK_UAR_USER (defined in V1 migration), so no manual cleanup needed there.
        userRepository.delete(user);
    }

    // Departments
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToDepartmentDto)
                .collect(Collectors.toList());
    }

    public DepartmentDto getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .map(this::mapToDepartmentDto)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
    }

    public DepartmentDto createDepartment(DepartmentDto departmentDto) {
        if (departmentRepository.existsByCode(departmentDto.getCode())) {
            throw new DuplicateResourceException("Ce code de département existe déjà");
        }
        Department department = Department.builder()
                .code(departmentDto.getCode())
                .name(departmentDto.getName())
                .description(departmentDto.getDescription())
                .build();
        return mapToDepartmentDto(departmentRepository.save(department));
    }

    public DepartmentDto updateDepartment(Long id, DepartmentDto departmentDto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        if (departmentRepository.existsByCodeAndIdNot(departmentDto.getCode(), id)) {
            throw new DuplicateResourceException("Ce code de département existe déjà");
        }
        department.setCode(departmentDto.getCode());
        department.setName(departmentDto.getName());
        department.setDescription(departmentDto.getDescription());
        return mapToDepartmentDto(departmentRepository.save(department));
    }

    public void deleteDepartment(Long id) {
        departmentRepository.deleteById(id);
    }

    // Roles
    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToRoleDto)
                .collect(Collectors.toList());
    }

    public RoleDto getRoleById(Long id) {
        return roleRepository.findById(id)
                .map(this::mapToRoleDto)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
    }

    public RoleDto createRole(RoleDto roleDto) {
        if (roleRepository.existsByNom(roleDto.getNom())) {
            throw new DuplicateResourceException("Ce nom de rôle existe déjà");
        }
        Role role = Role.builder()
                .nom(roleDto.getNom())
                .description(roleDto.getDescription())
                .build();
        return mapToRoleDto(roleRepository.save(role));
    }

    public RoleDto updateRole(Long id, RoleDto roleDto) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        if (roleRepository.existsByNomAndIdNot(roleDto.getNom(), id)) {
            throw new DuplicateResourceException("Ce nom de rôle existe déjà");
        }

        role.setNom(roleDto.getNom());
        role.setDescription(roleDto.getDescription());
        return mapToRoleDto(roleRepository.save(role));
    }

    public void deleteRole(Long id) {
        if (userApplicationRoleRepository.existsByRoleId(id)
                || applicationRoleRepository.findByRoleId(id).size() > 0) {
            throw new ResourceInUseException("Ce rôle est encore assigné à des utilisateurs ou applications. Veuillez d'abord révoquer ce rôle avant de le supprimer.");
        }
        roleRepository.deleteById(id);
    }

    // User Application-Role Assignment
    public UserDto assignRoleToUser(Long userId, Long applicationId, Long roleId) {
        User user = userRepository.findByIdWithApplicationRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        assignRoleToUserInternal(user, applicationId, roleId);
        user = userRepository.findByIdWithApplicationRoles(userId).orElseThrow();
        return mapToUserDto(user);
    }

    public UserDto revokeRoleFromUser(Long userId, Long applicationId, Long roleId) {
        User user = userRepository.findByIdWithApplicationRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.getUserApplicationRoles().removeIf(uar ->
                uar.getApplication().getId().equals(applicationId)
                && uar.getRole().getId().equals(roleId));
        userRepository.save(user);

        user = userRepository.findByIdWithApplicationRoles(userId).orElseThrow();
        return mapToUserDto(user);
    }

    private void assignRoleToUserInternal(User user, Long applicationId, Long roleId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        if (!applicationRoleRepository.existsByApplicationIdAndRoleId(applicationId, roleId)) {
            throw new IllegalArgumentException(
                "Le rôle '" + role.getNom() + "' n'est pas autorisé pour l'application '" + application.getCode() + "'.");
        }

        boolean alreadyAssigned = user.getUserApplicationRoles().stream()
                .anyMatch(uar -> uar.getApplication().getId().equals(applicationId)
                              && uar.getRole().getId().equals(roleId));

        if (!alreadyAssigned) {
            UserApplicationRole uar = UserApplicationRole.builder()
                    .user(user)
                    .application(application)
                    .role(role)
                    .build();
            user.getUserApplicationRoles().add(uar);
            userRepository.save(user);
        }
    }

    // Application-Role (valid pairings whitelist)
    public List<ApplicationRoleDto> getAllApplicationRoles() {
        return applicationRoleRepository.findAll().stream()
                .map(this::mapToApplicationRoleDto)
                .collect(Collectors.toList());
    }

    // Applications
    public List<ApplicationDto> getAllApplications() {
        return applicationRepository.findAll().stream()
                .map(this::mapToApplicationDto)
                .collect(Collectors.toList());
    }

    public ApplicationDto getApplicationById(Long id) {
        return applicationRepository.findById(id)
                .map(this::mapToApplicationDto)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }

    public ApplicationDto createApplication(ApplicationDto applicationDto) {
        if (applicationRepository.existsByCode(applicationDto.getCode())) {
            throw new DuplicateResourceException("Ce code d'application existe déjà");
        }

        Application.ApplicationBuilder builder = Application.builder()
                .code(applicationDto.getCode())
                .nom(applicationDto.getNom())
                .description(applicationDto.getDescription())
                .url(applicationDto.getUrl())
                .icon(applicationDto.getIcon())
                .status(applicationDto.getStatus() != null
                        ? Application.Status.valueOf(applicationDto.getStatus())
                        : Application.Status.ACTIVE);

        if (applicationDto.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(applicationDto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + applicationDto.getDepartmentId()));
            builder.department(dept);
        }

        Application application = builder.build();
        application = applicationRepository.save(application);

        // Persist role whitelist (APPLICATION_ROLES)
        if (applicationDto.getRoleIds() != null && !applicationDto.getRoleIds().isEmpty()) {
            for (Long roleId : applicationDto.getRoleIds()) {
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleId));
                ApplicationRole ar = ApplicationRole.builder()
                        .application(application)
                        .role(role)
                        .build();
                applicationRoleRepository.save(ar);
            }
        }

        return mapToApplicationDto(application);
    }

    public ApplicationDto updateApplication(Long id, ApplicationDto applicationDto) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (applicationRepository.existsByCodeAndIdNot(applicationDto.getCode(), id)) {
            throw new DuplicateResourceException("Ce code d'application existe déjà");
        }

        application.setCode(applicationDto.getCode());
        application.setNom(applicationDto.getNom());
        application.setDescription(applicationDto.getDescription());
        application.setUrl(applicationDto.getUrl());
        application.setIcon(applicationDto.getIcon());
        if (applicationDto.getStatus() != null) {
            application.setStatus(Application.Status.valueOf(applicationDto.getStatus()));
        }

        if (applicationDto.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(applicationDto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + applicationDto.getDepartmentId()));
            application.setDepartment(dept);
        } else {
            application.setDepartment(null);
        }

        // Sync role whitelist (APPLICATION_ROLES)
        if (applicationDto.getRoleIds() != null) {
            java.util.Set<Long> requestedRoleIds = new java.util.HashSet<>(applicationDto.getRoleIds());
            List<ApplicationRole> current = applicationRoleRepository.findByApplicationId(id);
            java.util.Set<Long> currentRoleIds = current.stream()
                    .map(ar -> ar.getRole().getId())
                    .collect(Collectors.toSet());

            // Roles to remove
            java.util.Set<Long> toRemove = new java.util.HashSet<>(currentRoleIds);
            toRemove.removeAll(requestedRoleIds);

            // SAFETY CHECK: Before removing any (app, role) pair, verify no users are assigned via USER_APPLICATION_ROLES
            if (!toRemove.isEmpty()) {
                List<String> blockingReasons = new java.util.ArrayList<>();
                for (Long roleId : toRemove) {
                    List<String> affectedUsers = userApplicationRoleRepository.findUserLoginsByApplicationIdAndRoleId(id, roleId);
                    if (!affectedUsers.isEmpty()) {
                        Role role = roleRepository.findById(roleId).orElse(null);
                        String roleName = role != null ? role.getNom() : "id=" + roleId;
                        blockingReasons.add(
                            "Rôle '" + roleName + "' est encore assigné aux utilisateurs: " + String.join(", ", affectedUsers)
                        );
                    }
                }
                if (!blockingReasons.isEmpty()) {
                    throw new ResourceInUseException(
                        "Impossible de retirer des rôles de cette application car des utilisateurs y sont encore assignés. " +
                        String.join(" | ", blockingReasons)
                    );
                }
                // Safe to remove now
                for (Long roleId : toRemove) {
                    ApplicationRoleId arId = new ApplicationRoleId(id, roleId);
                    applicationRoleRepository.deleteById(arId);
                }
            }

            // Roles to add
            java.util.Set<Long> toAdd = new java.util.HashSet<>(requestedRoleIds);
            toAdd.removeAll(currentRoleIds);
            for (Long roleId : toAdd) {
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleId));
                ApplicationRole ar = ApplicationRole.builder()
                        .application(application)
                        .role(role)
                        .build();
                applicationRoleRepository.save(ar);
            }
        }

        return mapToApplicationDto(applicationRepository.save(application));
    }

    public void deleteApplication(Long id) {
        int roleDefinitions = applicationRoleRepository.findByApplicationId(id).size();
        int userAssignments = userApplicationRoleRepository.findByApplicationId(id).size();

        if (roleDefinitions > 0 || userAssignments > 0) {
            StringBuilder msg = new StringBuilder(
                "Impossible de supprimer cette application : ");
            if (roleDefinitions > 0 && userAssignments > 0) {
                msg.append(roleDefinitions)
                   .append(" rôle(s) défini(s) et ")
                   .append(userAssignments)
                   .append(" utilisateur(s) assigné(s) sont encore liés. ")
                   .append("Supprimez d'abord les affectations et définitions de rôles.");
            } else if (roleDefinitions > 0) {
                msg.append(roleDefinitions)
                   .append(" rôle(s) sont encore définis pour cette application. ")
                   .append("Supprimez d'abord les définitions de rôles.");
            } else {
                msg.append(userAssignments)
                   .append(" utilisateur(s) ont encore accès à cette application. ")
                   .append("Révoquez d'abord ces accès.");
            }
            throw new ResourceInUseException(msg.toString());
        }

        applicationRepository.deleteById(id);
    }

    // Mappers
    private UserDto mapToUserDto(User user) {
        List<UserApplicationRoleDto> applicationRoleDtos = new ArrayList<>();
        if (user.getUserApplicationRoles() != null) {
            applicationRoleDtos = user.getUserApplicationRoles().stream()
                    .map(uar -> UserApplicationRoleDto.builder()
                            .applicationId(uar.getApplication().getId())
                            .applicationCode(uar.getApplication().getCode())
                            .applicationNom(uar.getApplication().getNom())
                            .roleId(uar.getRole().getId())
                            .roleNom(uar.getRole().getNom())
                            .roleDescription(uar.getRole().getDescription())
                            .build())
                    .collect(Collectors.toList());
        }

        return UserDto.builder()
                .id(user.getId())
                .login(user.getLogin())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .authType(user.getAuthType())
                .status(user.getStatus())
                .department(user.getDepartment() != null ? mapToDepartmentDto(user.getDepartment()) : null)
                .subDepartmentId(user.getSubDepartment() != null ? user.getSubDepartment().getId() : null)
                .subDepartment(user.getSubDepartment() != null ? mapToSubDepartmentDto(user.getSubDepartment()) : null)
                .applicationRoles(applicationRoleDtos)
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }

    private SubDepartmentDto mapToSubDepartmentDto(SubDepartment subDept) {
        return SubDepartmentDto.builder()
                .id(subDept.getId())
                .name(subDept.getName())
                .departmentId(subDept.getDepartment() != null ? subDept.getDepartment().getId() : null)
                .departmentName(subDept.getDepartment() != null ? subDept.getDepartment().getName() : null)
                .build();
    }

    private DepartmentDto mapToDepartmentDto(Department department) {
        return DepartmentDto.builder()
                .id(department.getId())
                .code(department.getCode())
                .name(department.getName())
                .description(department.getDescription())
                .build();
    }

    private RoleDto mapToRoleDto(Role role) {
        return RoleDto.builder()
                .id(role.getId())
                .nom(role.getNom())
                .description(role.getDescription())
                .build();
    }

    private ApplicationDto mapToApplicationDto(Application application) {
        List<ApplicationRole> appRoles = applicationRoleRepository.findByApplicationId(application.getId());
        List<RoleDto> roleDtos = appRoles.stream()
                .map(ar -> mapToRoleDto(ar.getRole()))
                .collect(Collectors.toList());
        List<Long> roleIds = roleDtos.stream()
                .map(RoleDto::getId)
                .collect(Collectors.toList());

        return ApplicationDto.builder()
                .id(application.getId())
                .code(application.getCode())
                .nom(application.getNom())
                .description(application.getDescription())
                .url(application.getUrl())
                .icon(application.getIcon())
                .status(application.getStatus().name())
                .departmentId(application.getDepartment() != null ? application.getDepartment().getId() : null)
                .departmentName(application.getDepartment() != null ? application.getDepartment().getName() : null)
                .roleIds(roleIds)
                .roles(roleDtos)
                .build();
    }

    private ApplicationRoleDto mapToApplicationRoleDto(ApplicationRole ar) {
        return ApplicationRoleDto.builder()
                .applicationId(ar.getApplication().getId())
                .applicationCode(ar.getApplication().getCode())
                .applicationNom(ar.getApplication().getNom())
                .roleId(ar.getRole().getId())
                .roleNom(ar.getRole().getNom())
                .roleDescription(ar.getRole().getDescription())
                .build();
    }
}
