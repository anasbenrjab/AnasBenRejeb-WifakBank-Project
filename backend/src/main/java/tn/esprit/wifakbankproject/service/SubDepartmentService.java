package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.dto.SubDepartmentDto;
import tn.esprit.wifakbankproject.entity.Department;
import tn.esprit.wifakbankproject.entity.SubDepartment;
import tn.esprit.wifakbankproject.exception.ResourceInUseException;
import tn.esprit.wifakbankproject.exception.ResourceNotFoundException;
import tn.esprit.wifakbankproject.repository.DepartmentRepository;
import tn.esprit.wifakbankproject.repository.SubDepartmentRepository;
import tn.esprit.wifakbankproject.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SubDepartmentService {

    private final SubDepartmentRepository subDepartmentRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SubDepartmentDto> findAll() {
        return subDepartmentRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubDepartmentDto> findByDepartmentId(Long departmentId) {
        return subDepartmentRepository.findByDepartmentId(departmentId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public SubDepartmentDto create(SubDepartmentDto dto) {
        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        SubDepartment subDept = SubDepartment.builder()
                .name(dto.getName())
                .department(dept)
                .build();
        return mapToDto(subDepartmentRepository.save(subDept));
    }

    public SubDepartmentDto update(Long id, SubDepartmentDto dto) {
        SubDepartment subDept = subDepartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sub-department not found"));
        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        subDept.setName(dto.getName());
        subDept.setDepartment(dept);
        return mapToDto(subDepartmentRepository.save(subDept));
    }

    public void delete(Long id) {
        SubDepartment subDept = subDepartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sub-department not found"));
        if (userRepository.existsBySubDepartmentId(id)) {
            throw new ResourceInUseException("Ce sous-département est encore assigné à des utilisateurs.");
        }
        subDepartmentRepository.delete(subDept);
    }

    private SubDepartmentDto mapToDto(SubDepartment subDept) {
        return SubDepartmentDto.builder()
                .id(subDept.getId())
                .name(subDept.getName())
                .departmentId(subDept.getDepartment().getId())
                .departmentName(subDept.getDepartment().getName())
                .build();
    }
}
