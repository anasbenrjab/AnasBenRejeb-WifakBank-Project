package tn.esprit.wifakbankproject.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.entity.*;
import tn.esprit.wifakbankproject.repository.*;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final SubDepartmentRepository subDepartmentRepository;
    private final ApplicationRepository applicationRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (departmentRepository.count() == 0) {
            initDepartments();
        }
        if (subDepartmentRepository.count() == 0) {
            initSubDepartments();
        }
        if (applicationRepository.count() == 0) {
            initApplications();
        }
        if (roleRepository.count() == 0) {
            initRoles();
        }
        if (userRepository.count() == 0) {
            initUsers();
        }
        if (userRoleRepository.count() == 0) {
            initUserRoles();
        }
    }

    private void initDepartments() {
        Department it = Department.builder().code("IT").name("Informatique").description("Département informatique").build();
        Department rh = Department.builder().code("RH").name("Ressources Humaines").description("Département RH").build();
        Department finance = Department.builder().code("FINANCE").name("Finance").description("Département finance").build();
        Department commercial = Department.builder().code("COMMERCIAL").name("Commercial").description("Département commercial").build();
        departmentRepository.saveAll(List.of(it, rh, finance, commercial));
    }

    private void initSubDepartments() {
        Department it = departmentRepository.findByCode("IT").orElseThrow();
        Department rh = departmentRepository.findByCode("RH").orElseThrow();

        SubDepartment devops = SubDepartment.builder().name("DevOps").department(it).build();
        SubDepartment data = SubDepartment.builder().name("Data").department(it).build();
        SubDepartment dev = SubDepartment.builder().name("Dev").department(it).build();
        SubDepartment qa = SubDepartment.builder().name("QA").department(it).build();
        SubDepartment recruitment = SubDepartment.builder().name("Recruitment").department(rh).build();
        SubDepartment payroll = SubDepartment.builder().name("Payroll").department(rh).build();
        subDepartmentRepository.saveAll(List.of(devops, data, dev, qa, recruitment, payroll));
    }

    private void initApplications() {
        Application doi = Application.builder().code("DOI").nom("Dématérialisation").description("Gestion documentaire dématérialisée").url("http://doi.wifakbank.tn").icon("description").authType("AD").status(Application.Status.ACTIVE).build();
        Application ged = Application.builder().code("GED").nom("GED").description("Gestion électronique des documents").url("http://ged.wifakbank.tn").icon("folder").authType("AD").status(Application.Status.ACTIVE).build();
        Application crm = Application.builder().code("CRM").nom("CRM").description("Gestion de la relation client").url("http://crm.wifakbank.tn").icon("people").authType("AD").status(Application.Status.ACTIVE).build();
        Application credit = Application.builder().code("CREDIT").nom("Crédit").description("Gestion des dossiers de crédit").url("http://credit.wifakbank.tn").icon("account_balance").authType("AD").status(Application.Status.ACTIVE).build();
        Application rhApp = Application.builder().code("RH").nom("Ressources Humaines").description("Gestion du personnel").url("http://rh.wifakbank.tn").icon("badge").authType("AD").status(Application.Status.ACTIVE).build();
        applicationRepository.saveAll(List.of(doi, ged, crm, credit, rhApp));
    }

    private void initRoles() {
        Role adminDoi = Role.builder().nom("Administrateur DOI").description("Accès complet DOI").build();
        Role consultationDoi = Role.builder().nom("Consultation DOI").description("Lecture seule DOI").build();
        Role adminGed = Role.builder().nom("Administrateur GED").description("Accès complet GED").build();
        Role consultationGed = Role.builder().nom("Consultation GED").description("Lecture seule GED").build();
        Role adminCrm = Role.builder().nom("Administrateur CRM").description("Accès complet CRM").build();
        Role consultationCrm = Role.builder().nom("Consultation CRM").description("Lecture seule CRM").build();
        Role adminCredit = Role.builder().nom("Administrateur CREDIT").description("Accès complet Crédit").build();
        Role validationCredit = Role.builder().nom("Validation CREDIT").description("Validation des dossiers Crédit").build();
        Role consultationCredit = Role.builder().nom("Consultation CREDIT").description("Lecture seule Crédit").build();
        Role responsableRh = Role.builder().nom("Responsable RH").description("Gestion complète RH").build();
        Role consultationRh = Role.builder().nom("Consultation RH").description("Lecture seule RH").build();
        roleRepository.saveAll(List.of(adminDoi, consultationDoi, adminGed, consultationGed, adminCrm, consultationCrm, adminCredit, validationCredit, consultationCredit, responsableRh, consultationRh));
    }

    private void initUsers() {
        Department it = departmentRepository.findByCode("IT").orElseThrow();
        Department finance = departmentRepository.findByCode("FINANCE").orElseThrow();
        SubDepartment devops = subDepartmentRepository.findByDepartmentId(it.getId()).stream().findFirst().orElseThrow();

        User admin = User.builder().login("admin").nom("Admin").prenom("Système").email("admin@wifakbank.tn").authType(User.AuthType.AD).status(User.Status.ACTIVE).createdAt(LocalDateTime.now()).department(it).subDepartment(devops).build();
        User ahmed = User.builder().login("ahmed").nom("Ben Ali").prenom("Ahmed").email("ahmed@wifakbank.tn").authType(User.AuthType.AD).status(User.Status.ACTIVE).createdAt(LocalDateTime.now()).department(finance).build();
        userRepository.saveAll(List.of(admin, ahmed));
    }

    private void initUserRoles() {
        User admin = userRepository.findByLogin("admin").orElseThrow();
        User ahmed = userRepository.findByLogin("ahmed").orElseThrow();
        Role adminDoi = roleRepository.findByNom("Administrateur DOI").orElseThrow();
        Role adminGed = roleRepository.findByNom("Administrateur GED").orElseThrow();
        Role adminCrm = roleRepository.findByNom("Administrateur CRM").orElseThrow();
        Role adminCredit = roleRepository.findByNom("Administrateur CREDIT").orElseThrow();
        Role responsableRh = roleRepository.findByNom("Responsable RH").orElseThrow();
        Role validationCredit = roleRepository.findByNom("Validation CREDIT").orElseThrow();
        Role consultationRh = roleRepository.findByNom("Consultation RH").orElseThrow();

        UserRole ur1 = UserRole.builder().user(ahmed).role(validationCredit).build();
        UserRole ur2 = UserRole.builder().user(ahmed).role(consultationRh).build();
        UserRole ur3 = UserRole.builder().user(ahmed).role(adminGed).build();
        UserRole ur4 = UserRole.builder().user(admin).role(adminDoi).build();
        UserRole ur5 = UserRole.builder().user(admin).role(adminGed).build();
        UserRole ur6 = UserRole.builder().user(admin).role(adminCrm).build();
        UserRole ur7 = UserRole.builder().user(admin).role(adminCredit).build();
        UserRole ur8 = UserRole.builder().user(admin).role(responsableRh).build();
        userRoleRepository.saveAll(List.of(ur1, ur2, ur3, ur4, ur5, ur6, ur7, ur8));
    }
}
