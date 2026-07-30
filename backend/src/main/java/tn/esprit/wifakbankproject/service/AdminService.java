package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.dto.ApplicationDto;
import tn.esprit.wifakbankproject.dto.DepartmentDto;
import tn.esprit.wifakbankproject.dto.RoleDto;
import tn.esprit.wifakbankproject.dto.UserDto;
import tn.esprit.wifakbankproject.dto.SubDepartmentDto;
import tn.esprit.wifakbankproject.entity.Application;
import tn.esprit.wifakbankproject.entity.Department;
import tn.esprit.wifakbankproject.entity.Role;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.entity.UserStatus;
import tn.esprit.wifakbankproject.entity.SubDepartment;
import tn.esprit.wifakbankproject.exception.DuplicateResourceException;
import tn.esprit.wifakbankproject.exception.ResourceInUseException;
import tn.esprit.wifakbankproject.exception.ResourceNotFoundException;
import tn.esprit.wifakbankproject.repository.ApplicationRepository;
import tn.esprit.wifakbankproject.repository.DepartmentRepository;
import tn.esprit.wifakbankproject.repository.RoleRepository;
import tn.esprit.wifakbankproject.repository.UserRepository;
import tn.esprit.wifakbankproject.repository.SubDepartmentRepository;

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
    private final PasswordEncoder passwordEncoder;
    private final SubDepartmentRepository subDepartmentRepository;

    // Users
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::mapToUserDto)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public UserDto createUser(UserDto userDto) {
        // Validate unique login
        if (userRepository.existsByLogin(userDto.getLogin())) {
            throw new DuplicateResourceException("Ce login existe déjà.");
        }
        // Validate unique email
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new DuplicateResourceException("Cet email existe déjà.");
        }
        // Validate roleId is required for new users
        if (userDto.getRoleId() == null) {
            throw new IllegalArgumentException("Un rôle est requis pour créer un utilisateur.");
        }

        User.UserBuilder userBuilder = User.builder()
                .login(userDto.getLogin())
                .nom(userDto.getNom())
                .prenom(userDto.getPrenom())
                .email(userDto.getEmail())
                .authType(userDto.getAuthType())
                .status(userDto.getStatus() != null ? userDto.getStatus() : UserStatus.ACTIF);

        // Handle password for LOCAL auth type
        if (userDto.getAuthType() == User.AuthType.LOCAL) {
            if (userDto.getPassword() == null || userDto.getPassword().isBlank()) {
                throw new IllegalArgumentException("Un mot de passe est requis pour les utilisateurs locaux.");
            }
            userBuilder.password(passwordEncoder.encode(userDto.getPassword()));
        }

        // Handle department if provided
        Department dept = null;
        if (userDto.getDepartment() != null && userDto.getDepartment().getId() != null) {
            dept = departmentRepository.findById(userDto.getDepartment().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
            userBuilder.department(dept);
        }

        // Handle sub-department if provided
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

        // Validate role exists
        Role role = roleRepository.findById(userDto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        User user = userBuilder.build();
        user.getRoles().add(role);
        user = userRepository.save(user);

        return mapToUserDto(user);
    }

    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
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

        // Clear and add roles safely to avoid unique constraint violations
        Set<Role> currentRoles = user.getRoles();
        Set<Role> targetRoles = new HashSet<>();

        if (userDto.getRoleIds() != null && !userDto.getRoleIds().isEmpty()) {
            for (Long rId : userDto.getRoleIds()) {
                Role role = roleRepository.findById(rId)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + rId));
                targetRoles.add(role);
            }
        } else if (userDto.getRoleId() != null) {
            Role role = roleRepository.findById(userDto.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + userDto.getRoleId()));
            targetRoles.add(role);
        }

        // Perform safe update of the collection
        currentRoles.removeIf(role -> !targetRoles.contains(role));
        for (Role role : targetRoles) {
            if (!currentRoles.contains(role)) {
                currentRoles.add(role);
            }
        }

        return mapToUserDto(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        // Check if user exists
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get current authenticated user's login
        String currentLogin = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByLogin(currentLogin).orElse(null);

        // Prevent deleting self
        if (currentUser != null && currentUser.getId().equals(id)) {
            throw new IllegalArgumentException("Vous ne pouvez pas supprimer votre propre compte.");
        }

        // Delete user (userRoles will cascade because of CascadeType.ALL in User entity)
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
        if (userRepository.existsByRolesId(id)) {
            throw new ResourceInUseException("Ce rôle est encore assigné à des utilisateurs. Veuillez d'abord révoquer ce rôle avant de le supprimer.");
        }
        roleRepository.deleteById(id);
    }

    // User Role Assignment
    public UserDto assignRoleToUser(Long userId, Long roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        // Check if already assigned
        boolean alreadyAssigned = user.getRoles().stream()
                .anyMatch(r -> r.getId().equals(roleId));

        if (!alreadyAssigned) {
            user.getRoles().add(role);
            userRepository.save(user);
        }

        return mapToUserDto(user);
    }

    public UserDto revokeRoleFromUser(Long userId, Long roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.getRoles().removeIf(r -> r.getId().equals(roleId));
        userRepository.save(user);

        return mapToUserDto(user);
    }

    // Applications (for dropdown in role form)
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

        Application application = Application.builder()
                .code(applicationDto.getCode())
                .nom(applicationDto.getNom())
                .description(applicationDto.getDescription())
                .url(applicationDto.getUrl())
                .icon(applicationDto.getIcon())
                .status(applicationDto.getStatus() != null 
                        ? Application.Status.valueOf(applicationDto.getStatus()) 
                        : Application.Status.ACTIVE)
                .build();

        application = applicationRepository.save(application);
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

        return mapToApplicationDto(applicationRepository.save(application));
    }

    public void deleteApplication(Long id) {
        applicationRepository.deleteById(id);
    }

    // Mappers
    private UserDto mapToUserDto(User user) {
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
                .roles(user.getRoles().stream()
                        .map(this::mapToRoleDto)
                        .collect(Collectors.toList()))
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
        return ApplicationDto.builder()
                .id(application.getId())
                .code(application.getCode())
                .nom(application.getNom())
                .description(application.getDescription())
                .url(application.getUrl())
                .icon(application.getIcon())
                .status(application.getStatus().name())
                .build();
    }
}
