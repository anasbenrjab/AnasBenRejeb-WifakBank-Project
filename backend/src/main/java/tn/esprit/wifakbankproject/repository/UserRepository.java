package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.wifakbankproject.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLogin(String login);
    Optional<User> findByEmail(String email);
    boolean existsByLogin(String login);
    boolean existsByEmail(String email);
    boolean existsBySubDepartmentId(Long subDepartmentId);

    /**
     * Loads a User WITHOUT joining userApplicationRoles.
     * Use this when you only need to update scalar fields — the roles
     * collection stays as an uninitialized proxy so cascade=MERGE on
     * save() has nothing to traverse and cannot cause NonUniqueObjectException.
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.department LEFT JOIN FETCH u.subDepartment WHERE u.id = :id")
    Optional<User> findByIdForScalarUpdate(@Param("id") Long id);

    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.userApplicationRoles uar " +
           "LEFT JOIN FETCH uar.role r " +
           "LEFT JOIN FETCH uar.application a")
    List<User> findAllWithApplicationRoles();

    @Query("SELECT u FROM User u " +
           "LEFT JOIN FETCH u.userApplicationRoles uar " +
           "LEFT JOIN FETCH uar.role r " +
           "LEFT JOIN FETCH uar.application a " +
           "WHERE u.id = :id")
    Optional<User> findByIdWithApplicationRoles(@Param("id") Long id);
}
